
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
  // Check if the error message contains information about a database policy issue
  const isDatabasePolicyError = error && (
    error.includes("infinite recursion") || 
    error.includes("policy for relation") || 
    error.includes("Database Policy Error")
  );

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
      {error && (
        <p className="text-center text-sm mt-4">
          {isDatabasePolicyError 
            ? "We've detected a database configuration issue. Our team has been notified and is working on a fix. Please try again later."
            : "There was an error processing your request. Please try refreshing the page and try again."}
        </p>
      )}
    </motion.div>
  );
};
