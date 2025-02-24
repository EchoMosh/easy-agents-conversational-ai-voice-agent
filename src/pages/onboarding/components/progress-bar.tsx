
import { motion } from "framer-motion";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressBar = ({ currentStep, totalSteps }: ProgressBarProps) => {
  return (
    <div className="w-full bg-muted rounded-full h-2">
      <motion.div
        className="h-full bg-primary rounded-full"
        initial={{ width: "0%" }}
        animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
};
