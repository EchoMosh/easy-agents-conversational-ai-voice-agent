
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  submessage?: string;
  error?: string | null;
}

export const LoadingSpinner = ({ 
  message = "Setting up your workspace...", 
  submessage = "This might take a few moments...",
  error = null
}: LoadingSpinnerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center space-y-4"
    >
      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      )}
      <p className="text-center text-lg font-medium">{message}</p>
      <p className="text-center text-sm text-muted-foreground">
        {submessage}
      </p>
    </motion.div>
  );
};
