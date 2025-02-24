
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

const queryClient = new QueryClient();

// Layout with sidebar for regular dashboard pages
const DashboardLayout = () => (
  <div className="flex h-screen overflow-hidden">
    <AppSidebar />
    <main className="flex-1">
      <div className="h-full w-full">
        <Outlet />
      </div>
    </main>
  </div>
);

// Clean layout without sidebar for flow editor
const FlowLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="h-screen">
    {children}
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SidebarProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Navigate to="/auth" replace />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              
              {/* Dashboard routes with sidebar */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Navigate to="agents" replace />} />
                <Route path="agents" element={<AgentsPage />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              {/* Flow editor route without sidebar */}
              <Route
                path="/dashboard/agents/flow/:id"
                element={
                  <FlowLayout>
                    <AgentFlowPage />
                  </FlowLayout>
                }
              />
            </Routes>
          </Router>
          <Toaster />
        </SidebarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
