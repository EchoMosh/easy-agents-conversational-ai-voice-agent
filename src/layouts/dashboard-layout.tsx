import { Suspense, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import LoadingScreen from "@/components/loading-screen";
import { useWorkspace } from "@/context/workspace-context";
import { ImportProvider } from "@/context/import-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardHeader from "@/components/dashboard/page";
import { useAppLoading, LoadingPriority } from "@/context/app-loading-context";
import { useApiLoading } from "@/hooks/use-api-loading";

function DashboardLayout() {
  const {
    isLoading: workspaceLoading,
    isWorkspaceReady,
    currentWorkspace,
  } = useWorkspace();
  const { isAnyLoading, isCriticalLoading, criticalLoadingMessage } =
    useAppLoading();
  const navigate = useNavigate();

  // We're now using a direct registration in the workspace context
  // No need to re-register the loading state here

  // Effect to redirect if workspace is not loading but also not ready
  useEffect(() => {
    if (!workspaceLoading && !isWorkspaceReady) {
      console.log(
        "Workspace not ready but not loading, redirecting to onboarding"
      );
      // Delay the redirect slightly to prevent flickering if data is still loading
      const timer = setTimeout(() => {
        navigate("/onboarding");
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [workspaceLoading, isWorkspaceReady, navigate]);

  // Show loading screen if anything is loading
  if (isAnyLoading) {
    return (
      <LoadingScreen
        message={criticalLoadingMessage || "Loading workspace..."}
      />
    );
  }

  // Extra safety check - don't render dashboard without a workspace
  if (!currentWorkspace) {
    return <LoadingScreen message="Waiting for workspace..." />;
  }

  return (
    <ImportProvider>
      <SidebarProvider defaultOpen={false}>
        <div className="h-screen w-screen flex overflow-hidden bg-background relative">
          <AppSidebar />
          <main className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader />
            <div className="flex-1 overflow-auto">
              <Suspense fallback={<LoadingScreen />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
          <Toaster />
          <SonnerToaster position="bottom-right" />
        </div>
      </SidebarProvider>
    </ImportProvider>
  );
}

export default DashboardLayout;
