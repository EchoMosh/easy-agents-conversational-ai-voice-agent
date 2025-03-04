
import { Loader } from "lucide-react";

export function AIVoiceLoader() {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
      <div className="bg-background border border-border rounded-lg shadow-lg p-8 max-w-md w-full mx-auto flex flex-col items-center space-y-4">
        <Loader className="h-10 w-10 text-primary animate-spin" />
        <h3 className="text-xl font-medium text-foreground">Updating Agent</h3>
        <p className="text-muted-foreground text-center">
          Please wait while we process your request...
        </p>
      </div>
    </div>
  );
}
