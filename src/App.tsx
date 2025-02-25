
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/theme/theme-provider';
import { Toaster } from './components/ui/toaster';
import { AppSidebar } from './components/dashboard/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

// Auth and onboarding pages
import AuthPage from './pages/auth';
import OnboardingPage from './pages/onboarding';

// Dashboard pages
import AgentsPage from './pages/dashboard/agents';
import LeadsPage from './pages/dashboard/leads';
import SettingsPage from './pages/dashboard/settings';
import ProfilePage from './pages/dashboard/profile';
import AgentFlowPage from './pages/dashboard/agent-flow';
import PipelinesPage from './pages/dashboard/pipelines';

const queryClient = new QueryClient();

// Layout with sidebar for regular dashboard pages
const DashboardLayout = () => (
  <div className="min-h-screen flex w-full">
    <AppSidebar />
    <main className="flex-1">
      <Outlet />
    </main>
  </div>
);

// Clean layout without sidebar for flow editor
const FlowLayout = () => (
  <div className="min-h-screen w-full">
    <AgentFlowPage />
  </div>
);

function App() {
  return (
    <ThemeProvider defaultTheme="system" attribute="class">
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <Router>
              <Routes>
                {/* Redirect root to auth with login mode by default */}
                <Route path="/" element={<Navigate to="/auth?mode=login" replace />} />
                
                {/* Handle both /auth and /auth?mode=X */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                
                {/* Dashboard routes with sidebar */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<Navigate to="agents" replace />} />
                  <Route path="agents" element={<AgentsPage />} />
                  <Route path="leads" element={<LeadsPage />} />
                  <Route path="pipelines" element={<PipelinesPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>

                {/* Flow editor route without sidebar */}
                <Route path="/dashboard/agents/flow/:id" element={<FlowLayout />} />
              </Routes>
            </Router>
          </div>
          <Toaster />
        </SidebarProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
