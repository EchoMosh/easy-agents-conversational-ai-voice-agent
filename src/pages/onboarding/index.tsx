
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingSpinner } from "./components/loading-spinner";
import { ProgressBar } from "./components/progress-bar";
import { QuestionForm } from "./components/question-form";
import { useOnboarding } from "./hooks/use-onboarding";
import { steps } from "./components/steps";

const OnboardingPage = () => {
  const {
    currentStep,
    isLoading,
    isCompleting,
    data,
    checkSession,
    handleInputChange,
    handleNext,
    handleKeyPress,
  } = useOnboarding();

  useEffect(() => {
    checkSession();
  }, []);

  const currentQuestion = steps[currentStep - 1];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md mx-auto px-4">
        <AnimatePresence mode="wait">
          {isCompleting ? (
            <LoadingSpinner />
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
