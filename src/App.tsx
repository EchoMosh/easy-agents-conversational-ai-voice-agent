
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
import AgentFlowPage from "@/pages/dashboard/agent-flow";
import LeadsPage from "@/pages/dashboard/leads";
import PipelinesPage from "@/pages/dashboard/pipelines";
import SettingsPage from "@/pages/dashboard/settings";
import ProfilePage from "@/pages/dashboard/profile";
import ChatsPage from "@/pages/dashboard/chats";
import { ChatPage } from "@/pages/dashboard/chat"; // Fixed import to use named export
import KnowledgePage from "@/pages/dashboard/knowledge";
import AutomationsPage from "@/pages/dashboard/automations";

// Create a new QueryClient instance
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route path="/dashboard/agents" element={<AgentsPage />} />
              <Route path="/dashboard/agents/flow/:id" element={<AgentFlowPage />} />
              <Route path="/dashboard/leads" element={<LeadsPage />} />
              <Route path="/dashboard/pipelines" element={<PipelinesPage />} />
              <Route path="/dashboard/settings" element={<SettingsPage />} />
              <Route path="/dashboard/profile" element={<ProfilePage />} />
              <Route path="/dashboard/chats" element={<ChatsPage />} />
              <Route path="/dashboard/chats/:id" element={<ChatPage />} />
              <Route path="/dashboard/knowledge" element={<KnowledgePage />} />
              <Route path="/dashboard/automations" element={<AutomationsPage />} />
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
