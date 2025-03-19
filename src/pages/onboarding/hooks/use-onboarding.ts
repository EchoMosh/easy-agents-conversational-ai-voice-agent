
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { steps } from "../components/steps";
import type { OnboardingData } from "../types";

export const useOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [data, setData] = useState<OnboardingData>({
    firstName: "",
    lastName: "",
    workspaceName: "",
    workspaceIcon: "building",
    businessType: "",
    employeeCount: "",
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setCheckingSession(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user has any workspaces
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', session.user.id);

      if (memberError) {
        if (memberError.code === '42P17') {
          console.log("Database policy issue detected in onboarding check.");
          toast({
            variant: "destructive",
            title: "Database Error",
            description: "There seems to be an issue with database policies. Please contact support.",
          });
        } else {
          console.error('Workspace check error:', memberError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to check workspaces. Please try again later.",
          });
        }
      }

      // If user has workspaces and onboarding is completed, redirect to dashboard
      if (memberData && memberData.length > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile?.onboarding_completed) {
          navigate("/dashboard/agents");
          return;
        }
      }
      
      setCheckingSession(false);
    } catch (error: any) {
      console.error('Session check error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify your session. Please try logging in again.",
      });
      navigate("/auth");
    }
  };

  const handleInputChange = (value: string) => {
    setData(prev => ({ ...prev, [steps[currentStep - 1].field]: value }));
  };

  const completeOnboarding = async () => {
    setIsCompleting(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      try {
        // The user profile and workspace will be created by the trigger
        // We just need to update the metadata
        const { error: metadataError } = await supabase.auth.updateUser({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            workspaceName: data.workspaceName,
            workspaceIcon: data.workspaceIcon,
            businessType: data.businessType,
            employeeCount: data.employeeCount,
            onboardingCompleted: true
          }
        });

        if (metadataError) throw metadataError;
        
        // Then update the profile directly
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            first_name: data.firstName,
            last_name: data.lastName,
            business_type: data.businessType,
            employee_count: data.employeeCount,
            onboarding_completed: true,
          })
          .eq("id", session.user.id);

        if (profileError) throw profileError;

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if a workspace was created during this process
        const { data: workspaces, error: workspacesError } = await supabase
          .from('workspaces')
          .select('*')
          .eq('owner_id', session.user.id)
          .limit(1);

        if (!workspacesError && workspaces && workspaces.length > 0) {
          navigate("/dashboard/agents");
        } else {
          // Something went wrong with workspace creation, show an error
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to set up your workspace. Please try again.",
          });
          setIsCompleting(false);
        }
      } catch (error: any) {
        console.error('Onboarding error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to complete onboarding",
        });
        setIsCompleting(false);
      }
    }
  };

  const handleNext = async () => {
    const currentField = steps[currentStep - 1].field;
    if (!data[currentField]) {
      toast({
        variant: "destructive",
        title: "Required",
        description: "Please fill out this field to continue",
      });
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  return {
    currentStep,
    isLoading,
    isCompleting,
    data,
    checkingSession,
    handleInputChange,
    handleNext,
    handleKeyPress,
  };
};
