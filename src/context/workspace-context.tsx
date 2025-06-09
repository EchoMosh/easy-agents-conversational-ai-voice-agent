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
  const { registerLoadingState, unregisterLoadingState } = useAppLoading();
  const navigate = useNavigate();
  const { session } = useAuth();

  const workspaceQuery = useWorkspaceQuery();

  useEffect(() => {
    const priority = workspaceQuery.hasLoadedWorkspaceOnce ? LoadingPriority.MEDIUM : LoadingPriority.HIGH;
    registerLoadingState('workspace', workspaceQuery.isLoading, priority);
    return () => unregisterLoadingState('workspace');
  }, [workspaceQuery.isLoading, registerLoadingState, unregisterLoadingState, workspaceQuery.hasLoadedWorkspaceOnce]);

  // Clear redirect attempts on mount
  useEffect(() => {
    localStorage.removeItem("workspaceRedirectAttempt");
  }, []);

  // Handle navigation to onboarding if no workspaces
  useEffect(() => {
    if (workspaceQuery.workspaces && workspaceQuery.workspaces.length === 0 && session && workspaceQuery.hasLoadedWorkspaceOnce) {
      const redirectAttempt = localStorage.getItem("workspaceRedirectAttempt");
      const now = Date.now();

      if (!redirectAttempt || now - parseInt(redirectAttempt) > 30000) {
        localStorage.setItem("workspaceRedirectAttempt", now.toString());
        navigate("/onboarding");
      }
    }
  }, [workspaceQuery.workspaces, session, navigate, workspaceQuery.hasLoadedWorkspaceOnce]);

  // Clear cache when session ends
  useEffect(() => {
    if (!session) {
      localStorage.removeItem("cachedWorkspace");
    }
  }, [session]);

  // Simply pass through all the data from useWorkspaceQuery
  return <WorkspaceContext.Provider value={workspaceQuery}>{children}</WorkspaceContext.Provider>;
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

export default WorkspaceProvider;
