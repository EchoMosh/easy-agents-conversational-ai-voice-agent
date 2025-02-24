
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

type Step = {
  id: number;
  question: string;
  field: keyof OnboardingData;
  type: "text" | "number" | "select";
  options?: string[];
  description?: string;
};

type OnboardingData = {
  firstName: string;
  lastName: string;
  workspaceName: string;
  businessType: string;
  employeeCount: string;
};

const steps: Step[] = [
  {
    id: 1,
    question: "What's your first name?",
    field: "firstName",
    type: "text",
  },
  {
    id: 2,
    question: "And your last name?",
    field: "lastName",
    type: "text",
  },
  {
    id: 3,
    question: "What would you like to name your workspace?",
    field: "workspaceName",
    type: "text",
    description: "Don't worry, you can change this later",
  },
  {
    id: 4,
    question: "What type of business are you in?",
    field: "businessType",
    type: "select",
    options: [
      "Real Estate",
      "Technology",
      "Healthcare",
      "Finance",
      "Retail",
      "Other",
    ],
  },
  {
    id: 5,
    question: "How many employees do you have?",
    field: "employeeCount",
    type: "select",
    options: ["1-10", "11-50", "51-200", "201-1000", "1000+"],
  },
];

const OnboardingPage = () => {
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

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
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
  };

  const handleInputChange = (value: string) => {
    const currentField = steps[currentStep - 1].field;
    setData({ ...data, [currentField]: value });
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

  const completeOnboarding = async () => {
    setIsCompleting(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      try {
        // Update user profile
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

        // Create initial workspace
        const { data: workspace, error: workspaceError } = await supabase
          .from("workspaces")
          .insert({
            name: data.workspaceName,
            owner_id: session.user.id,
          })
          .select()
          .single();

        if (workspaceError) throw workspaceError;

        // Add user as workspace member
        const { error: memberError } = await supabase
          .from("workspace_members")
          .insert({
            workspace_id: workspace.id,
            user_id: session.user.id,
            role: "owner",
          });

        if (memberError) throw memberError;

        // Artificial delay for smooth animation
        await new Promise(resolve => setTimeout(resolve, 2000));
        navigate("/dashboard/agents");
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      } finally {
        setIsCompleting(false);
      }
    }
  };

  const currentQuestion = steps[currentStep - 1];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <AnimatePresence mode="wait">
        {isCompleting ? (
          <motion.div
            key="completing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mx-auto w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
            />
            <h2 className="text-2xl font-bold">Setting up your workspace...</h2>
            <p className="text-muted-foreground">Almost there!</p>
          </motion.div>
        ) : (
          <motion.div
            key="questions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md space-y-8"
          >
            <div className="space-y-2 text-center">
              <motion.h2
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold tracking-tight"
              >
                {currentQuestion.question}
              </motion.h2>
              {currentQuestion.description && (
                <p className="text-muted-foreground text-sm">
                  {currentQuestion.description}
                </p>
              )}
              <p className="text-muted-foreground">
                Step {currentStep} of {steps.length}
              </p>
            </div>

            <motion.div
              key={`input-${currentStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {currentQuestion.type === "select" ? (
                <div className="grid grid-cols-2 gap-3">
                  {currentQuestion.options?.map((option) => (
                    <Button
                      key={option}
                      variant={data[currentQuestion.field] === option ? "default" : "outline"}
                      onClick={() => handleInputChange(option)}
                      className="h-auto py-4 px-6"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              ) : (
                <Input
                  type={currentQuestion.type}
                  value={data[currentQuestion.field]}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your answer here..."
                  className="text-lg py-6"
                />
              )}

              <Button
                onClick={handleNext}
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {currentStep === steps.length ? "Complete Setup" : "Continue"}
              </Button>
            </motion.div>

            <div className="w-full bg-muted rounded-full h-2">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${(currentStep / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingPage;
