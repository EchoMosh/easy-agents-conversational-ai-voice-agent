
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Step, OnboardingData } from "../types";

interface QuestionFormProps {
  currentQuestion: Step;
  data: OnboardingData;
  onInputChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onNext: () => void;
  currentStep: number;
  totalSteps: number;
  isLoading: boolean;
}

export const QuestionForm = ({
  currentQuestion,
  data,
  onInputChange,
  onKeyPress,
  onNext,
  currentStep,
  totalSteps,
  isLoading,
}: QuestionFormProps) => {
  return (
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
              onClick={() => onInputChange(option)}
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
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyPress}
          placeholder="Type your answer here..."
          className="text-lg py-6"
        />
      )}

      <Button
        onClick={onNext}
        className="w-full"
        size="lg"
        disabled={isLoading}
      >
        {currentStep === totalSteps ? "Complete Setup" : "Continue"}
      </Button>
    </motion.div>
  );
};
