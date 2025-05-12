import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { ErrorBoundary } from "./error-boundary";
import { useAppLoading, LoadingPriority } from "@/context/app-loading-context";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { Button } from "./ui/button";

interface LoadingScreenProps {
  message?: string;
  fullscreen?: boolean;
}

export default function LoadingScreen({
  message,
  fullscreen = true,
}: LoadingScreenProps) {
  const { isAnyLoading, isCriticalLoading, criticalLoadingMessage } =
    useAppLoading();
  const [isVisible, setIsVisible] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  const loadingStartTime = useRef<number | null>(null);
  const longLoadingTimeout = useRef<NodeJS.Timeout | null>(null);
  const veryLongLoadingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Handle loading visibility and time tracking
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let timerInterval: NodeJS.Timeout;

    if (isAnyLoading) {
      // Start tracking loading time
      if (!loadingStartTime.current) {
        loadingStartTime.current = Date.now();
      }

      // Slight delay before showing the loading screen to prevent flashing
      timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);

      // Update loading time every second for progress feedback
      timerInterval = setInterval(() => {
        if (loadingStartTime.current) {
          const elapsedTime = Math.floor(
            (Date.now() - loadingStartTime.current) / 1000
          );
          setLoadingTime(elapsedTime);
        }
      }, 1000);

      // Set timeouts for long loading states (10 seconds)
      longLoadingTimeout.current = setTimeout(() => {
        console.log("Loading taking longer than expected...");
      }, 10000);

      // Set timeouts for very long loading states (30 seconds) - show refresh button
      veryLongLoadingTimeout.current = setTimeout(() => {
        console.log("Loading taking much longer than expected...");
        setShowRefreshButton(true);
      }, 30000);
    } else {
      // Reset all loading state
      setIsVisible(false);
      setLoadingTime(0);
      setShowRefreshButton(false);
      loadingStartTime.current = null;

      // Clear long loading timeouts
      if (longLoadingTimeout.current) {
        clearTimeout(longLoadingTimeout.current);
      }
      if (veryLongLoadingTimeout.current) {
        clearTimeout(veryLongLoadingTimeout.current);
      }
    }

    return () => {
      clearTimeout(timer);
      clearInterval(timerInterval);

      if (longLoadingTimeout.current) {
        clearTimeout(longLoadingTimeout.current);
      }
      if (veryLongLoadingTimeout.current) {
        clearTimeout(veryLongLoadingTimeout.current);
      }
    };
  }, [isAnyLoading]);

  // Handle page refresh
  const handleRefresh = () => {
    window.location.reload();
  };

  // Don't render anything if not loading
  if (!isAnyLoading || !isVisible) {
    return null;
  }

  // Use fallback messaging hierarchy:
  // 1. Explicitly provided message
  // 2. Critical loading message from context
  // 3. Default message
  const displayMessage = message || criticalLoadingMessage || "Loading...";

  // Full-screen overlay for critical loading
  if (fullscreen) {
    return (
      <ErrorBoundary>
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
            "transition-opacity duration-300",
            isVisible ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="flex flex-col items-center bg-card p-6 rounded-lg shadow-lg animate-in fade-in duration-300 max-w-sm">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="mt-4 text-lg font-medium text-primary">
              {displayMessage}
            </p>

            {/* Show loading time when it's taking a while */}
            {loadingTime > 2 && (
              <div className="mt-3 text-sm text-muted-foreground text-center">
                <p className="font-medium">
                  Loading for {loadingTime} second{loadingTime !== 1 ? "s" : ""}
                </p>
                <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${Math.min(loadingTime * 2, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Show appropriate guidance based on loading time */}
            <p className="mt-3 text-xs text-muted-foreground text-center">
              {loadingTime > 20
                ? "This is taking longer than expected. You can try refreshing the page."
                : loadingTime > 5
                ? "This may take a moment. Please be patient..."
                : "Loading your workspace..."}
            </p>

            {/* Show refresh button if loading takes too long */}
            {showRefreshButton && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleRefresh}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            )}
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Inline loading indicator for non-full screen use
  return (
    <ErrorBoundary>
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 text-primary animate-spin mr-2" />
        <p className="text-sm text-muted-foreground">{displayMessage}</p>
      </div>
    </ErrorBoundary>
  );
}

// Inline loading component that doesn't block the UI
export function InlineLoading({ message }: { message?: string }) {
  return <LoadingScreen message={message} fullscreen={false} />;
}
