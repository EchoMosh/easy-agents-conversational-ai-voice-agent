
import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner = ({ message = "Setting up your workspace..." }: LoadingSpinnerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center space-y-4"
    >
      <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      <p className="text-center text-lg font-medium">{message}</p>
      <p className="text-center text-sm text-muted-foreground">
        This might take a few moments...
      </p>
    </motion.div>
  );
};
