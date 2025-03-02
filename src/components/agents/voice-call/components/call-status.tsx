
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface CallStatusProps {
  isLoading: boolean;
  error: string | null;
  agentName: string;
  onRetry: () => void;
  onClose: () => void;
}

export function CallStatus({ isLoading, error, agentName, onRetry, onClose }: CallStatusProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner className="h-8 w-8 border-t-2 border-b-2 border-primary mb-4" />
        <p className="text-center text-sm text-muted-foreground">
          Connecting to {agentName}...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <div className="flex gap-2 justify-center">
          <Button onClick={onRetry} variant="outline">Retry</Button>
          <Button onClick={onClose} variant="default">Close</Button>
        </div>
      </div>
    );
  }

  return null;
}
