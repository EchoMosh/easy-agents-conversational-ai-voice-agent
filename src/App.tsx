import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "@/pages/Index";
import OnboardingPage from "@/pages/onboarding";
import AuthPage from "@/pages/auth";
import NotFound from "@/pages/NotFound";
import DashboardLayout from "@/layouts/dashboard-layout";
import AgentsPage from "@/pages/dashboard/agents";
import AgentFlowPage from './pages/dashboard/agent-flow';
import LeadsPage from "@/pages/dashboard/leads";
import PipelinesPage from "@/pages/dashboard/pipelines";
import SettingsPage from "@/pages/dashboard/settings";
import ProfilePage from "@/pages/dashboard/profile";
import ChatsPage from "@/pages/dashboard/chats";
import { ChatPage } from "@/pages/dashboard/chat";
import KnowledgePage from "@/pages/dashboard/knowledge";
import AutomationsPage from "@/pages/dashboard/automations";
import DashboardPage from "@/pages/dashboard/dashboard";
import CalendarPage from "@/pages/dashboard/calendar";
import LeadScraperPage from "@/pages/dashboard/lead-scraper";
import ProtectedRoute from "@/components/auth/protected-route";

// Create a new QueryClient instance
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route path="/dashboard/overview" element={<DashboardPage />} />
                <Route path="/dashboard/calendar" element={<CalendarPage />} />
                <Route path="/dashboard/agents" element={<AgentsPage />} />
                <Route path="/dashboard/agents/flow/:id" element={<AgentFlowPage />} />
                <Route path="/dashboard/leads" element={<LeadsPage />} />
                <Route path="/dashboard/lead-scraper" element={<LeadScraperPage />} />
                <Route path="/dashboard/pipelines" element={<PipelinesPage />} />
                <Route path="/dashboard/settings" element={<SettingsPage />} />
                <Route path="/dashboard/profile" element={<ProfilePage />} />
                <Route path="/dashboard/chats" element={<ChatsPage />} />
                <Route path="/dashboard/chats/:id" element={<ChatPage />} />
                <Route path="/dashboard/knowledge" element={<KnowledgePage />} />
                <Route path="/dashboard/automations" element={<AutomationsPage />} />
              </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
        <SonnerToaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
