
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/theme/theme-provider';
import { Toaster } from './components/ui/toaster';
import { AppSidebar } from './components/dashboard/app-sidebar';

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
const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen">
    <AppSidebar />
    <main className="flex-1 overflow-y-auto">
      {children}
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
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            
            {/* Dashboard routes with sidebar */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route path="agents" element={<AgentsPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Flow editor route without sidebar */}
            <Route
              path="/dashboard/agents/:id/flow"
              element={
                <FlowLayout>
                  <AgentFlowPage />
                </FlowLayout>
              }
            />
          </Routes>
        </Router>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
