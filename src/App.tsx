import React from "react";
import { Routes, Route, useRoutes } from "react-router-dom";
import routes from "tempo-routes";
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
import LeadsPage from "@/pages/dashboard/leads";
import PipelinesPage from "@/pages/dashboard/pipelines";
import SettingsPage from "@/pages/dashboard/settings";
import KnowledgePage from "@/pages/dashboard/knowledge";
import TranscriptionsPage from "@/pages/dashboard/transcriptions-page";
import { PhoneNumbersPage } from "@/pages/dashboard/phone-numbers/phone-numbers-page";
import ProtectedRoute from "@/components/auth/protected-route";
import { ErrorBoundary } from "@/components/error-boundary";

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
            <Route index element={<AgentsPage />} />
            <Route path="/dashboard/agents" element={<AgentsPage />} />
            <Route
              path="/dashboard/agents/flow/:id"
              element={<AgentFlowPage />}
            />
            <Route path="/dashboard/leads" element={<LeadsPage />} />
            <Route path="/dashboard/pipelines" element={<PipelinesPage />} />
            <Route path="/dashboard/settings" element={<SettingsPage />} />
            <Route path="/dashboard/knowledge" element={<KnowledgePage />} />
            <Route
              path="/dashboard/transcriptions"
              element={<TranscriptionsPage />}
            />
            <Route
              path="/dashboard/phone-numbers"
              element={
                <React.Suspense
                  fallback={
                    <LoadingScreen message="Loading phone numbers..." />
                  }
                >
                  <PhoneNumbersPage />
                </React.Suspense>
              }
            />
          </Route>
        </Route>

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
