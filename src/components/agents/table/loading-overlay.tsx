
import React from "react";

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-lg font-medium">Deleting...</p>
        <p className="text-sm text-muted-foreground">Please wait while we process your request.</p>
      </div>
    </div>
  );
}
