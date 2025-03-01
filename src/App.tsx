
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import DashboardLayout from "@/layouts/dashboard-layout";
import AuthPage from "@/pages/auth";
import OnboardingPage from "@/pages/onboarding";
import NotFound from "@/pages/NotFound";

// Dashboard pages
import AgentsPage from "@/pages/dashboard/agents";
import AgentFlowPage from "@/pages/dashboard/agent-flow";
import ChatsPage from "@/pages/dashboard/chats";
import { ChatPage } from "@/pages/dashboard/chat";
import KnowledgePage from "@/pages/dashboard/knowledge";
import LeadsPage from "@/pages/dashboard/leads";
import PipelinesPage from "@/pages/dashboard/pipelines";
import ProfilePage from "@/pages/dashboard/profile";
import SettingsPage from "@/pages/dashboard/settings";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<NotFound />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard/agents" replace />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="agents/:id" element={<AgentFlowPage />} />
            <Route path="chats" element={<ChatsPage />} />
            <Route path="chat/:id" element={<ChatPage />} />
            <Route path="knowledge" element={<KnowledgePage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="pipelines" element={<PipelinesPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
