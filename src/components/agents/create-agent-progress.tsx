import { motion } from "framer-motion";

const STEP_LABELS = ["Name", "Role", "Script"];

interface CreateAgentProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const CreateAgentProgress = ({
  currentStep,
  totalSteps,
}: CreateAgentProgressProps) => {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          Step {currentStep} of {totalSteps}:{" "}
          {STEP_LABELS[currentStep - 1] ?? ""}
        </span>
        <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};
