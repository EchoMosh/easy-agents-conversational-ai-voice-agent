import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { steps } from "../components/steps";
import type { OnboardingData } from "../types";
import { useWorkspace } from "@/context/workspace-context";
import { useAuth } from "@/hooks/use-auth";

/**
 * Hook managing the onboarding flow.
 *
 * Session state is provided by `useAuth`. If no session exists we redirect to
 * `/auth`. When a profile already has `onboarding_completed` set we skip the
 * steps entirely and go straight to the dashboard.
 */
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
  const {
    createDefaultWorkspace,
    isWorkspaceReady,
    hasLoadedWorkspaceOnce,
    refreshWorkspaces,
  } = useWorkspace();
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

      // Check if the user's profile has already completed onboarding
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile check error:", profileError);
      }

      if (profile?.onboarding_completed) {
        // Also check if they have a workspace before redirecting
        const { data: memberData, error: memberError } = await supabase
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", session.user.id)
          .limit(1);

        if (memberError) {
          console.error("Workspace member check error:", memberError);
        }

        if (memberData && memberData.length > 0) {
          // User has completed onboarding AND has a workspace, redirect to dashboard
          setCheckingSession(false);
          navigate("/dashboard/agents");
          return;
        }
        // User completed onboarding but has no workspace, let them go through onboarding again
        console.log(
          "User has completed onboarding but has no workspace, allowing re-onboarding",
        );
      }

      setCheckingSession(false);
    } catch (error) {
      console.error("Session check error:", error);
      setCheckingSession(false);
    }
  };

  const handleInputChange = (value: string) => {
    setData((prev) => ({ ...prev, [steps[currentStep - 1].field]: value }));
  };

  const completeOnboarding = async () => {
    setIsCompleting(true);
    setError(null);

    try {
      // Force refresh session before any database operations
      console.log("Refreshing session before onboarding completion...");
      const {
        data: { session: refreshedSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session refresh error:", sessionError);
        throw new Error("Failed to refresh session");
      }

      if (!refreshedSession?.user) {
        console.error("No valid session found after refresh");
        navigate("/auth");
        setIsCompleting(false);
        return;
      }

      console.log(
        "Session refreshed successfully. User ID:",
        refreshedSession.user.id,
      );
      console.log(
        "Starting onboarding completion for user:",
        refreshedSession.user.id,
      );

      // Log session data to check authentication context in client
      console.log("Checking authentication context from client session...");
      console.log("Session user data:", refreshedSession.user);

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
        .eq("id", refreshedSession.user.id); // Use refreshed session

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
          onboardingCompleted: true,
        },
      });

      if (metadataError) {
        console.error("Metadata update error:", metadataError);
        throw metadataError;
      }

      console.log("User metadata updated successfully");

      // Create the workspace using context method with the name from onboarding
      // The database trigger will automatically add the user as a member
      try {
        console.log(
          "Creating workspace using context method with name:",
          data.workspaceName,
        );
        console.log(
          "Current time before workspace creation:",
          new Date().toISOString(),
        );
        const startTime = Date.now();

        // The createDefaultWorkspace function now has session refresh built-in,
        // but we've also refreshed here for extra safety
        const workspace = await createDefaultWorkspace({
          name: data.workspaceName,
          icon: data.workspaceIcon,
        });

        const endTime = Date.now();
        console.log(
          "Workspace creation took",
          (endTime - startTime) / 1000,
          "seconds",
        );
        console.log(
          "Current time after workspace creation:",
          new Date().toISOString(),
        );

        if (!workspace) {
          console.error("Workspace creation returned empty workspace");
          setError("Could not create your workspace. Please try again later.");
          setIsCompleting(false);
          return;
        }

        console.log("Workspace created successfully:", workspace);

        // Force a refresh of workspace data to ensure the loading state updates
        console.log("Refreshing workspace data after creation");
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Small delay before refresh
        try {
          console.log(
            "Current time before workspace refresh:",
            new Date().toISOString(),
          );
          const refreshStartTime = Date.now();
          await refreshWorkspaces();
          const refreshEndTime = Date.now();
          console.log(
            "Workspace refresh took",
            (refreshEndTime - refreshStartTime) / 1000,
            "seconds",
          );
          console.log("Workspace data refreshed successfully");
          console.log(
            "Current time after workspace refresh:",
            new Date().toISOString(),
          );
        } catch (refreshError) {
          console.error("Error refreshing workspace data:", refreshError);
        }
      } catch (workspaceError: any) {
        console.error("Workspace creation error:", workspaceError);
        if (workspaceError.details) {
          console.error("Error details:", workspaceError.details);
        }
        if (workspaceError.hint) {
          console.error("Error hint:", workspaceError.hint);
        }
        setError(workspaceError.message || "Failed to create workspace");
        setIsCompleting(false);
        return;
      }

      // Add delay to allow database changes to propagate
      await new Promise((resolve) => setTimeout(resolve, 3000));

      navigate("/dashboard/agents");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      const errorMessage =
        error.message || "Failed to complete onboarding. Please try again.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      setIsCompleting(false);
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
    if (e.key === "Enter") {
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
