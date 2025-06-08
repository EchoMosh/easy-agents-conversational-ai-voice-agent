
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { steps } from "../components/steps";
import type { OnboardingData } from "../types";
import { useWorkspace } from "@/context/workspace-context";

export const useOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const { createDefaultWorkspace, isWorkspaceReady, hasLoadedWorkspaceOnce } = useWorkspace();
  const { session, isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading) {
      if (!session) {
        navigate("/auth");
      } else {
        checkSession();
      }
    }
  }, [isAuthLoading, session]);

  const checkSession = async () => {
    try {
      setCheckingSession(true);
      if (!session) {
        navigate("/auth");
        return;
      }

      // First check the user's profile for onboarding status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile check error:', profileError);
      }

      // If profile explicitly shows onboarding completed, skip onboarding
      if (profile?.onboarding_completed === true) {
        setCheckingSession(false);
        navigate("/dashboard/agents");
        return;
      }

      // Check if user has any workspaces (existing user check)
      try {
        const { data: memberData, error: memberError } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', session.user.id);

        if (!memberError && memberData && memberData.length > 0) {
          // User has workspaces, they're an existing user
          console.log('Existing user detected with workspaces, ensuring onboarding flag is set');
          
          // Ensure the onboarding_completed flag is set for this user
          if (!profile?.onboarding_completed) {
            await supabase
              .from('profiles')
              .update({ onboarding_completed: true })
              .eq('id', session.user.id);
          }

          setCheckingSession(false);
          navigate("/dashboard/agents");
          return;
        }
      } catch (error) {
        console.error("Failed to check workspace membership:", error);
      }


      // If we reach here, treat as new user needing onboarding
      
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
    setError(null);
    if (!session?.user) {
      navigate("/auth");
      setIsCompleting(false);
      return;
    }

    if (session?.user) {
      try {
        console.log("Starting onboarding completion for user:", session.user.id);
        
        // First update the user profile before creating workspace
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

        if (profileError) {
          console.error("Profile update error:", profileError);
          throw profileError;
        }
        
        console.log("Profile updated successfully");

        // Update the user metadata 
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

        if (metadataError) {
          console.error("Metadata update error:", metadataError);
          throw metadataError;
        }
        
        console.log("User metadata updated successfully");

        // Create the workspace using context method with the name from onboarding
        // The database trigger will automatically add the user as a member
        try {
          console.log("Creating workspace using context method with name:", data.workspaceName);
          const workspace = await createDefaultWorkspace(data.workspaceName, data.workspaceIcon);
          
          if (!workspace) {
            console.error("Workspace creation returned empty workspace");
            setError("Could not create your workspace. Please try again later.");
            setIsCompleting(false);
            return;
          }
          
          console.log("Workspace created successfully:", workspace);
            
        } catch (workspaceError: any) {
          console.error("Workspace creation error:", workspaceError);
          setError(workspaceError.message || "Failed to create workspace");
          setIsCompleting(false);
          return;
        }

        // Add delay to allow database changes to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));

        navigate("/dashboard/agents");
      } catch (error: any) {
        console.error('Onboarding error:', error);
        const errorMessage = error.message || "Failed to complete onboarding. Please try again.";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage
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
    error,
    handleInputChange,
    handleNext,
    handleKeyPress,
  };
};
