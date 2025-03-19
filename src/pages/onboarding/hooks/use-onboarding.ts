
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
          if (memberError.code === '42P17' || memberError.message?.includes('infinite recursion')) {
            console.log("Database policy issue detected in onboarding check. Continuing with onboarding.");
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
    setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      try {
        console.log("Starting onboarding completion for user:", session.user.id);
        
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

        if (metadataError) {
          console.error("Metadata update error:", metadataError);
          throw metadataError;
        }
        
        console.log("User metadata updated successfully");
        
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

        if (profileError) {
          console.error("Profile update error:", profileError);
          throw profileError;
        }
        
        console.log("Profile updated successfully");

        // Check if the user already has workspaces
        const { data: existingWorkspaces, error: workspaceCheckError } = await supabase
          .from('workspaces')
          .select('id')
          .eq('owner_id', session.user.id);
          
        if (workspaceCheckError && !workspaceCheckError.message.includes('infinite recursion')) {
          console.error("Workspace check error:", workspaceCheckError);
          throw workspaceCheckError;
        }
        
        // Skip workspace creation if the user already has one
        if (existingWorkspaces && existingWorkspaces.length > 0) {
          console.log("User already has workspaces, skipping creation");
          
          // Just set the current workspace
          const { error: updateProfileError } = await supabase
            .from('profiles')
            .update({ current_workspace_id: existingWorkspaces[0].id })
            .eq('id', session.user.id);
            
          if (updateProfileError) {
            console.error("Failed to update current workspace:", updateProfileError);
            throw updateProfileError;
          }
          
          // Add delay to allow database changes to propagate
          await new Promise(resolve => setTimeout(resolve, 2000));
          navigate("/dashboard/agents");
          return;
        }

        // Create the workspace
        console.log("Creating new workspace:", data.workspaceName);
        const { data: workspace, error: workspaceError } = await supabase
          .from('workspaces')
          .insert({
            name: data.workspaceName,
            icon: data.workspaceIcon,
            owner_id: session.user.id
          })
          .select()
          .single();

        if (workspaceError) {
          console.error("Workspace creation error:", workspaceError);
          throw workspaceError;
        }

        console.log("Workspace created:", workspace);

        // Add the user as an owner, with retry logic to handle policy issues
        let memberError = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            const { error } = await supabase
              .from('workspace_members')
              .insert({
                workspace_id: workspace.id,
                user_id: session.user.id,
                role: 'owner'
              });
              
            if (error) {
              console.error(`Attempt ${retryCount + 1} error:`, error);
              if (error.message?.includes('infinite recursion') || error.code === '42P17') {
                console.log(`Retry ${retryCount + 1}: Policy issue detected, waiting before retry...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                retryCount++;
                continue;
              } else {
                memberError = error;
                break;
              }
            } else {
              console.log("Successfully added user to workspace");
              memberError = null;
              break;
            }
          } catch (error: any) {
            console.error(`Retry ${retryCount + 1} failed:`, error);
            memberError = error;
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (memberError) {
          console.error("Failed to add user to workspace after multiple attempts:", memberError);
          setError("Could not add you to the workspace. The issue has been logged and will be resolved soon.");
          return;
        }

        // Set as current workspace
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update({ current_workspace_id: workspace.id })
          .eq('id', session.user.id);

        if (updateProfileError) {
          console.error("Failed to update profile with workspace:", updateProfileError);
          throw updateProfileError;
        }

        console.log("Profile updated with current workspace");

        // Add delay to allow database changes to propagate
        await new Promise(resolve => setTimeout(resolve, 2000));

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
