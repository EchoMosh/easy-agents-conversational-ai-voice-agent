
import { ReactNode, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { supabase } from "@/integrations/supabase/client";
import { WorkspaceProvider } from "@/context/workspace-context";
import { useState } from "react";

// Import the header component directly
import DashboardHeader from "@/components/dashboard/page";

interface DashboardLayoutProps {
  children?: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error("Error checking session:", error);
        setUser(null);
      } finally {
        setIsSessionLoading(false);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // If we're still checking the session, show a loading indicator
  if (isSessionLoading) {
    return <div className="h-screen w-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>;
  }

  // If not logged in, redirect to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return (
    <WorkspaceProvider>
      <div className="flex h-screen w-full bg-white dark:bg-gray-950">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-y-auto">
          <DashboardHeader />
          <div className="flex-1">
            {children || <Outlet />}
          </div>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
