import { useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
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

// Import all dashboard page components
import DashboardPage from "@/pages/dashboard/dashboard";
import CalendarPage from "@/pages/dashboard/calendar";
import AgentsPage from "@/pages/dashboard/agents";
import AgentFlowPage from "@/pages/dashboard/agent-flow";
import LeadsPage from "@/pages/dashboard/leads";
import LeadScraperPage from "@/pages/dashboard/lead-scraper";
import PipelinesPage from "@/pages/dashboard/pipelines";
import SettingsPage from "@/pages/dashboard/settings";
import ProfilePage from "@/pages/dashboard/profile";
import ChatsPage from "@/pages/dashboard/chats";
import { ChatPage } from "@/pages/dashboard/chat";
import KnowledgePage from "@/pages/dashboard/knowledge";
import TranscriptionsPage from "@/pages/dashboard/transcriptions-page";
import AutomationsPage from "@/pages/dashboard/automations";
import ActivitiesPage from "@/pages/dashboard/activities";
// Note: NotFound page might be handled by App.tsx's catch-all route

function DashboardLayout() {
  const {
    isLoading: workspaceLoading,
    isWorkspaceReady,
    currentWorkspace,
    hasLoadedWorkspaceOnce, // Consume new flag
  } = useWorkspace();
  const { isAnyLoading, isCriticalLoading, criticalLoadingMessage } =
    useAppLoading();
  const navigate = useNavigate();
  const location = useLocation();

  // We're now using a direct registration in the workspace context
  // No need to re-register the loading state here

  // Effect to redirect if workspace is not loading but also not ready
  useEffect(() => {
    // If loading is complete, but there's no workspace, redirect to onboarding.
    if (!workspaceLoading && !currentWorkspace && location.pathname !== "/onboarding") {
      console.log(
        "No workspace found after loading, redirecting to onboarding from:",
        location.pathname
      );
      navigate("/onboarding");
    }
  }, [workspaceLoading, currentWorkspace, navigate, location.pathname]);

  // Show a loading screen if there is no current workspace yet.
  if (!currentWorkspace) {
    return (
      <LoadingScreen
        message={criticalLoadingMessage || "Loading workspace..."}
      />
    );
  }
  
  // For non-critical 'isAnyLoading' (e.g., background refetches after initial load), 
  // we will render the layout and let child components show their skeletons.
  // The <Outlet />'s Suspense fallback will handle lazy-loaded page components.
  // Individual page components (LeadsPage, AgentsPage) will handle their own data loading skeletons.

  return (
    <ImportProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="h-screen w-screen flex overflow-hidden bg-background relative">
          {/* Hide sidebar on agent flow edit page */}
          {!location.pathname.includes('/dashboard/agents/flow/') && <AppSidebar />}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Hide DashboardHeader on agent flow edit page */}
            {!location.pathname.includes('/dashboard/agents/flow/') && <DashboardHeader />}
            <div className="flex-1 overflow-auto p-4 md:p-6">
              <Outlet />
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
