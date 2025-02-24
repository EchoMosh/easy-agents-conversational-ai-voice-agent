
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { OnboardingData } from "../types";

export const useOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    firstName: "",
    lastName: "",
    workspaceName: "",
    businessType: "",
    employeeCount: "",
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile?.onboarding_completed) {
        navigate("/dashboard/agents");
      }
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

        const { data: workspace, error: workspaceError } = await supabase
          .from("workspaces")
          .insert({
            name: data.workspaceName,
            owner_id: session.user.id,
          })
          .select()
          .single();

        if (workspaceError) throw workspaceError;

        const { error: memberError } = await supabase
          .from("workspace_members")
          .insert({
            workspace_id: workspace.id,
            user_id: session.user.id,
            role: "owner",
          });

        if (memberError) throw memberError;

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
    checkSession,
    handleInputChange,
    handleNext,
    handleKeyPress,
  };
};
