
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
      try {
        const { data: memberData, error: memberError } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', session.user.id);

        if (memberError) {
          console.error('Workspace check error:', memberError);
          if (memberError.code === '42P17') {
            console.log("Database policy issue detected in onboarding check.");
            // Continue with onboarding as this is likely a policy config issue
          } else {
            throw memberError;
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
      } catch (error) {
        console.error("Failed to check workspace membership:", error);
        // Continue with onboarding
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
        // Update the user metadata first
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

        // Create the workspace manually (since the trigger may fail)
        const { data: workspace, error: workspaceError } = await supabase
          .from('workspaces')
          .insert({
            name: data.workspaceName,
            icon: data.workspaceIcon,
            owner_id: session.user.id
          })
          .select()
          .single();

        if (workspaceError) throw workspaceError;

        console.log("Workspace created:", workspace);

        // Add the user as an owner
        const { error: memberError } = await supabase
          .from('workspace_members')
          .insert({
            workspace_id: workspace.id,
            user_id: session.user.id,
            role: 'owner'
          });

        if (memberError) throw memberError;

        // Set as current workspace
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update({ current_workspace_id: workspace.id })
          .eq('id', session.user.id);

        if (updateProfileError) throw updateProfileError;

        // Add delay to allow database changes to propagate
        await new Promise(resolve => setTimeout(resolve, 2000));

        navigate("/dashboard/agents");
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
