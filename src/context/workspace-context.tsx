import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { LoadingPriority, useAppLoading } from "./app-loading-context";
import { useWorkspace as useWorkspaceQuery } from "@/hooks/use-workspace";
import { useAuth } from "./auth-context";
import { useQueryClient } from "@tanstack/react-query";

// Define the Workspace type (assuming it's not imported)
interface Workspace {
  id: string;
  name: string;
  icon?: string;
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  isWorkspaceReady: boolean;
  hasLoadedWorkspaceOnce: boolean;
  switchWorkspace: (workspace: Workspace) => Promise<Workspace>;
  refreshWorkspaces: () => Promise<void>;
  createDefaultWorkspace: (params?: {
    name?: string;
    icon?: string;
  }) => Promise<Workspace | null>;
  creationError: string | null;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const cachedWorkspace = localStorage.getItem('cachedWorkspace');
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(
    cachedWorkspace ? JSON.parse(cachedWorkspace) : null
  );
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const { registerLoadingState, unregisterLoadingState } = useAppLoading();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const workspaceQuery = useWorkspaceQuery();
  const {
    workspaces: data,
    isLoading,
    isWorkspaceReady,
    currentWorkspace,
    hasLoadedWorkspaceOnce,
  } = workspaceQuery;

  useEffect(() => {
    const priority = hasLoadedWorkspaceOnce ? LoadingPriority.MEDIUM : LoadingPriority.HIGH;
    registerLoadingState('workspace', isLoading, priority);
    return () => unregisterLoadingState('workspace');
  }, [isLoading, registerLoadingState, unregisterLoadingState, hasLoadedWorkspaceOnce]);

  // Clear redirect attempts on mount
  useEffect(() => {
    localStorage.removeItem("workspaceRedirectAttempt");
  }, []);

  useEffect(() => {
    if (data) {
      setWorkspaces(data);
      if (currentWorkspace) {
        setActiveWorkspace(currentWorkspace);
        localStorage.setItem(
          "cachedWorkspace",
          JSON.stringify(currentWorkspace)
        );
        if (!hasLoadedWorkspaceOnce) {}
      } else if (data.length === 0 && session) {
        const redirectAttempt = localStorage.getItem("workspaceRedirectAttempt");
        const now = Date.now();

        if (!redirectAttempt || now - parseInt(redirectAttempt) > 30000) {
          localStorage.setItem("workspaceRedirectAttempt", now.toString());
          navigate("/onboarding");
        }
      }
    }
    if (!session) {
      localStorage.removeItem("cachedWorkspace");
      setActiveWorkspace(null);
      setWorkspaces([]);
    }
  }, [data, session, navigate, hasLoadedWorkspaceOnce, currentWorkspace]);

  const refreshWorkspaces = workspaceQuery.refreshWorkspaces;
  const createDefaultWorkspace = workspaceQuery.createDefaultWorkspace;
  const switchWorkspace = workspaceQuery.switchWorkspace;

  const value: WorkspaceContextType = {
    currentWorkspace: activeWorkspace,
    workspaces,
    isLoading,
    isWorkspaceReady,
    hasLoadedWorkspaceOnce,
    switchWorkspace,
    refreshWorkspaces,
    createDefaultWorkspace: workspaceQuery.createDefaultWorkspace,
    creationError: workspaceQuery.creationError,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

export default WorkspaceProvider;
