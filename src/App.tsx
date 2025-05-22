import { Routes, Route, useRoutes } from "react-router-dom";
import routes from "tempo-routes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import {
  AppLoadingProvider,
  useAppLoading,
} from "@/context/app-loading-context";
import LoadingScreen from "@/components/loading-screen";
import Index from "@/pages/Index";
import OnboardingPage from "@/pages/onboarding";
import AuthPage from "@/pages/auth";
import NotFound from "@/pages/NotFound";
import DashboardLayout from "@/layouts/dashboard-layout";
import AgentsPage from "@/pages/dashboard/agents";
import AgentFlowPage from "./pages/dashboard/agent-flow";
// import { BetaAgentFlowPage } from "./pages/dashboard/agent-flow/beta-agent-flow-page"; // Removed
import LeadsPage from "@/pages/dashboard/leads";
import PipelinesPage from "@/pages/dashboard/pipelines";
import SettingsPage from "@/pages/dashboard/settings";
import ProfilePage from "@/pages/dashboard/profile";
import ChatsPage from "@/pages/dashboard/chats";
import { ChatPage } from "@/pages/dashboard/chat";
import KnowledgePage from "@/pages/dashboard/knowledge";
import TranscriptionsPage from "@/pages/dashboard/transcriptions-page"; // Added for Transcriptions
import AutomationsPage from "@/pages/dashboard/automations";
import ActivitiesPage from "@/pages/dashboard/activities";
import DashboardPage from "@/pages/dashboard/dashboard";
import CalendarPage from "@/pages/dashboard/calendar";
import LeadScraperPage from "@/pages/dashboard/lead-scraper";
import ProtectedRoute from "@/components/auth/protected-route";
import { ErrorBoundary } from "@/components/error-boundary";
import { SidebarProvider } from "@/components/ui/sidebar"; // Added

// Content component to handle loading states
function AppContent() {
  const { isAnyLoading, isCriticalLoading, criticalLoadingMessage } =
    useAppLoading();

  // Show loading screen for critical loading operations at the app level
  if (isCriticalLoading) {
    return (
      <LoadingScreen
        message={criticalLoadingMessage || "Loading application..."}
      />
    );
  }

  return (
    <>
      {/* Tempo routes */}
      {import.meta.env.VITE_TEMPO && useRoutes(routes)}
      <Routes>
        <Route
          path="/"
          element={
            <ErrorBoundary>
              <Index />
            </ErrorBoundary>
          }
        />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<AuthPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="/dashboard/overview" element={<DashboardPage />} />
            <Route path="/dashboard/calendar" element={<CalendarPage />} />
            <Route path="/dashboard/agents" element={<AgentsPage />} />
            <Route
              path="/dashboard/agents/flow/:id"
              element={<AgentFlowPage />}
            />
            {/* BetaAgentFlowPage route moved outside DashboardLayout */}
            <Route path="/dashboard/leads" element={<LeadsPage />} />
            <Route
              path="/dashboard/lead-scraper"
              element={<LeadScraperPage />}
            />
            <Route path="/dashboard/pipelines" element={<PipelinesPage />} />
            <Route path="/dashboard/settings" element={<SettingsPage />} />
            <Route path="/dashboard/profile" element={<ProfilePage />} />
            <Route path="/dashboard/chats" element={<ChatsPage />} />
            <Route path="/dashboard/chats/:id" element={<ChatPage />} />
            <Route path="/dashboard/knowledge" element={<KnowledgePage />} />
            <Route path="/dashboard/transcriptions" element={<TranscriptionsPage />} /> {/* Added Transcriptions route */}
            <Route
              path="/dashboard/automations"
              element={<AutomationsPage />}
            />
            <Route path="/dashboard/activities" element={<ActivitiesPage />} />
          </Route>
        </Route>

        {/* Protected routes */}
        {/* Removed BetaAgentFlowPage route here. AgentFlowPage will handle both modes. */}
        {/* The SidebarProvider was for BetaAgentFlowPage when it was standalone. 
            AgentFlowPage is already within DashboardLayout which should provide necessary contexts,
            or AgentFlowPage itself handles its context providers if it's meant to be standalone.
            Given AgentFlowPage is typically part of DashboardLayout, this should be fine.
            If AgentFlowPage was also moved out of DashboardLayout, it would need its own SidebarProvider.
            But since it's the main flow page, it's likely intended to be within DashboardLayout.
            The previous change to move BetaAgentFlowPage out of DashboardLayout was to remove the main nav.
            If AgentFlowPage now handles beta mode and needs to sometimes NOT show main nav, that's a new complexity
            for AgentFlowPage itself. For now, assuming AgentFlowPage is always within DashboardLayout.
        */}

        {/* Add this before the catchall route */}
        {import.meta.env.VITE_TEMPO && <Route path="/tempobook/*" />}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <SonnerToaster />
    </>
  );
}

function App() {
  console.log("App rendering");

  return (
    <ErrorBoundary
      fallback={
        <div className="p-8 rounded border border-red-200 bg-red-50 text-red-800 m-4">
          <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
          <p className="mb-4">
            The application encountered an error. Please check the console for
            details and try refreshing the page.
          </p>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      }
    >
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
