import { useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import LoadingScreen from "@/components/loading-screen";
import { useWorkspace } from "@/context/workspace-context";
import { ImportProvider } from "@/context/import-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardHeader from "@/components/dashboard/page";
import { useAppLoading, LoadingPriority } from "@/context/app-loading-context";
import { useApiLoading } from "@/hooks/use-api-loading";
// Skeleton import might not be needed here if pages handle their own full-page skeletons
// Or if the Suspense fallback for Outlet was the primary use.
// For now, let's keep it in case we want a generic content area skeleton.

// Note: Page components are imported in App.tsx where routes are defined

function DashboardLayout() {
  const {
    isLoading: workspaceLoading,
    isWorkspaceReady,
    currentWorkspace,
    hasLoadedWorkspaceOnce,
    workspaces,
  } = useWorkspace();
  const { isAnyLoading, isCriticalLoading, criticalLoadingMessage } =
    useAppLoading();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle workspace loading and redirect logic
  useEffect(() => {
    // Only proceed if workspace loading is complete
    if (!hasLoadedWorkspaceOnce || workspaceLoading) return;

    // Prevent redirect if we're already on the onboarding page
    if (location.pathname === "/onboarding") return;

    // If no workspaces exist and we're done loading, redirect to onboarding
    // But only if we haven't already attempted this redirect
    if (workspaces.length === 0) {
      const lastRedirect = sessionStorage.getItem("lastWorkspaceRedirect");
      const now = Date.now();

      // Only redirect if we haven't redirected in the last 5 seconds
      if (!lastRedirect || now - parseInt(lastRedirect) > 5000) {
        console.log(
          "DashboardLayout: No workspaces found, redirecting to onboarding",
        );
        sessionStorage.setItem("lastWorkspaceRedirect", now.toString());
        navigate("/onboarding", { replace: true });
      }
    }
  }, [
    hasLoadedWorkspaceOnce,
    workspaceLoading,
    workspaces,
    navigate,
    location.pathname,
  ]);

  // Show loading screen while workspace is loading
  if (!hasLoadedWorkspaceOnce || workspaceLoading) {
    return (
      <LoadingScreen
        message={criticalLoadingMessage || "Loading workspace..."}
      />
    );
  }

  // If no current workspace after loading is done, show a message
  // This handles edge cases where workspaces exist but none is current
  if (!currentWorkspace && workspaces.length > 0) {
    return <LoadingScreen message="Setting up your workspace..." />;
  }

  // If we're here with no workspace and no redirect happened, show error
  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">No Workspace Found</h2>
          <p className="text-muted-foreground mb-4">
            Please complete the onboarding process to create your workspace.
          </p>
          <button
            onClick={() => navigate("/onboarding")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go to Onboarding
          </button>
        </div>
      </div>
    );
  }

  // For non-critical 'isAnyLoading' (e.g., background refetches after initial load),
  // we will render the layout and let child components show their skeletons.
  // The <Outlet />'s Suspense fallback will handle lazy-loaded page components.
  // Individual page components (LeadsPage, AgentsPage) will handle their own data loading skeletons.

  return (
    <ImportProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="h-screen w-screen flex overflow-hidden bg-background relative bg-gradient-to-br from-background via-background to-primary/[0.02]">
          {/* Hide sidebar on agent flow edit page */}
          {!location.pathname.includes("/dashboard/agents/flow/") && (
            <AppSidebar />
          )}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Hide DashboardHeader on agent flow edit page */}
            {!location.pathname.includes("/dashboard/agents/flow/") && (
              <DashboardHeader />
            )}
            <div className="flex-1 overflow-auto p-4 md:p-6 bg-background/40">
              <Outlet />
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ImportProvider>
  );
}

export default DashboardLayout;
