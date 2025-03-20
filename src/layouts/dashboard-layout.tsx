import { ReactNode, useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { supabase } from "@/integrations/supabase/client";
import { WorkspaceProvider, useWorkspace } from "@/context/workspace-context";
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { toast } from "@/hooks/use-toast";

// Import the header component directly
import DashboardHeader from "@/components/dashboard/page";

interface DashboardLayoutProps {
  children?: ReactNode;
}

function Dashboard({ children }: { children?: ReactNode }) {
  const {
    currentWorkspace,
    workspaces,
    isLoading,
    createDefaultWorkspace,
    creationError,
  } = useWorkspace();
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleNoWorkspace = async () => {
      if (
        !isLoading &&
        workspaces.length === 0 &&
        !isCreatingWorkspace &&
        !creationError
      ) {
        console.log("No workspaces found, creating default workspace");
        setIsCreatingWorkspace(true);

        // Get user data to use for workspace name if available
        const { data } = await supabase.auth.getUser();
        const userMetadata = data?.user?.user_metadata;
        const workspaceName = userMetadata?.workspaceName || undefined;
        const workspaceIcon = userMetadata?.workspaceIcon || undefined;

        console.log(
          "Creating workspace with name:",
          workspaceName || "default"
        );
        const workspace = await createDefaultWorkspace(
          workspaceName,
          workspaceIcon
        );
        setIsCreatingWorkspace(false);

        if (!workspace) {
          console.log("Failed to create workspace, redirecting to onboarding");
          navigate("/onboarding");
        }
      }
    };

    handleNoWorkspace();
  }, [
    isLoading,
    workspaces,
    createDefaultWorkspace,
    isCreatingWorkspace,
    creationError,
    navigate,
  ]);

  // If there was an error creating the workspace, redirect to onboarding
  useEffect(() => {
    if (creationError) {
      console.log(
        "Workspace creation error detected, redirecting to onboarding"
      );
      navigate("/onboarding");
    }
  }, [creationError, navigate]);

  if (isLoading || isCreatingWorkspace) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!currentWorkspace) {
    console.log("No current workspace, redirecting to onboarding");
    return <Navigate to="/onboarding" />;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-white dark:bg-gray-950">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-y-auto">
          <DashboardHeader />
          <div className="flex-1">{children || <Outlet />}</div>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("Session check:", session ? "Valid session" : "No session");
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
        console.log("Auth state change:", event);
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // If we're still checking the session, show a loading indicator
  if (isSessionLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If not logged in, redirect to auth
  if (!user) {
    console.log("No user, redirecting to auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return (
    <WorkspaceProvider>
      <Dashboard children={children} />
    </WorkspaceProvider>
  );
}
