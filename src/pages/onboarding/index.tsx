import { motion, AnimatePresence } from "framer-motion";
import { LoadingSpinner } from "./components/loading-spinner";
import { ProgressBar } from "./components/progress-bar";
import { QuestionForm } from "./components/question-form";
import { useOnboarding } from "./hooks/use-onboarding";
import { steps } from "./components/steps";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const OnboardingPage = () => {
  const [setupError, setSetupError] = useState<string | null>(null);

  const {
    currentStep,
    isLoading,
    isCompleting,
    data,
    checkingSession,
    handleInputChange,
    handleNext,
    handleKeyPress,
    error: onboardingError,
  } = useOnboarding();

  const currentQuestion = steps[currentStep - 1];

  // Check if there are any database policy issues
  useEffect(() => {
    const checkDatabaseIssues = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const { error } = await supabase
          .from("workspace_members")
          .select("*")
          .limit(1);

        if (error) {
          console.error("Database check error:", error);
          if (
            error.message.includes("infinite recursion") ||
            error.code === "42P17" ||
            error.message.includes("policy for relation")
          ) {
            setSetupError(
              "Database Policy Error: There appears to be a database configuration issue. Our team has been notified and is working on a fix.",
            );
          }
        }
      } catch (error) {
        console.error("Error checking database status:", error);
      }
    };

    if (isCompleting) {
      checkDatabaseIssues();
    }
  }, [isCompleting]);

  if (checkingSession) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <div className="w-full max-w-md mx-auto px-4">
          <LoadingSpinner
            message="Checking your session..."
            submessage="We're verifying your account details..."
          />
        </div>
      </div>
    );
  }

  const displayError = setupError || onboardingError;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md mx-auto px-4">
        <AnimatePresence mode="wait">
          {isCompleting ? (
            <LoadingSpinner
              message="Setting up your workspace..."
              submessage="Creating your custom workspace and preparing everything for you..."
              error={displayError}
            />
          ) : (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-8"
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

              <QuestionForm
                currentQuestion={currentQuestion}
                data={data}
                onInputChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onNext={handleNext}
                currentStep={currentStep}
                totalSteps={steps.length}
                isLoading={isLoading}
              />

              <ProgressBar
                currentStep={currentStep}
                totalSteps={steps.length}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingPage;
