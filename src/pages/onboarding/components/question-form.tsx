
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconSelector } from "@/components/workspaces/icon-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OnboardingData, Step } from "../types";

interface QuestionFormProps {
  currentQuestion: Step;
  data: OnboardingData;
  onInputChange: (value: string) => void;
  onNext: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  currentStep: number;
  totalSteps: number;
  isLoading: boolean;
}

export function QuestionForm({
  currentQuestion,
  data,
  onInputChange,
  onNext,
  onKeyPress,
  currentStep,
  totalSteps,
  isLoading,
}: QuestionFormProps) {
  const [value, setValue] = useState(data[currentQuestion.field] || "");

  const handleChange = (newValue: string) => {
    setValue(newValue);
    onInputChange(newValue);
  };

  return (
    <div className="space-y-4">
      {currentQuestion.type === "text" && (
        <Input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Type your answer here"
          className="h-12 text-lg"
          onKeyDown={onKeyPress}
          autoFocus
        />
      )}

      {currentQuestion.type === "select" && (
        <Select
          value={value}
          onValueChange={handleChange}
        >
          <SelectTrigger className="h-12 text-lg">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {currentQuestion.options?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {currentQuestion.type === "icon" && (
        <IconSelector 
          value={value} 
          onChange={handleChange}
          icons={currentQuestion.options}
          className="mb-4"
        />
      )}

      <Button
        onClick={onNext}
        className="w-full h-12 text-lg"
        disabled={isLoading || !value}
      >
        {currentStep === totalSteps ? "Complete" : "Next"}
      </Button>
    </div>
  );
}
