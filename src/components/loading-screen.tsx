
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "./error-boundary";

export default function LoadingScreen() {
  return (
    <ErrorBoundary>
      <div className="flex items-center justify-center h-full w-full bg-background/50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    </ErrorBoundary>
  );
}
