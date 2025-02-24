
import { useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import AgentsPage from "./dashboard/agents";
import LeadsPage from "./dashboard/leads";
import SettingsPage from "./dashboard/settings";
import ProfilePage from "./dashboard/profile";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkUser();
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <div className="flex justify-between items-center p-4 border-b">
            <SidebarTrigger />
            <ThemeToggle />
          </div>
          <Routes>
            <Route path="agents" element={<AgentsPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
