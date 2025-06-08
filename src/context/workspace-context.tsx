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
  switchWorkspace: (workspace: Workspace) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  createDefaultWorkspace: (customWorkspaceName?: string, customIcon?: string) => Promise<Workspace | null>;
  creationError: string | null;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const cachedWorkspace = localStorage.getItem('cachedWorkspace');
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(
    cachedWorkspace ? JSON.parse(cachedWorkspace) : null
  );
  const [previousWorkspace, setPreviousWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [hasLoadedWorkspaceOnce, setHasLoadedWorkspaceOnce] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const { registerLoadingState, unregisterLoadingState } = useAppLoading();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const { data, isLoading } = useWorkspaceQuery();

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
      setWorkspaces(data.workspaces);
      if (data.current) {
        setPreviousWorkspace(activeWorkspace);
        setActiveWorkspace(data.current);
        localStorage.setItem('cachedWorkspace', JSON.stringify(data.current));
        if (!hasLoadedWorkspaceOnce) setHasLoadedWorkspaceOnce(true);
      } else if (data.workspaces.length === 0 && session) {
        // Ensure we're not in a loop - use local storage to prevent infinite redirects
        const redirectAttempt = localStorage.getItem("workspaceRedirectAttempt");
        const now = Date.now();

        if (!redirectAttempt || now - parseInt(redirectAttempt) > 30000) { // 30 seconds threshold
          localStorage.setItem("workspaceRedirectAttempt", now.toString());
          navigate('/onboarding');
        }
      }
    }
    if (!session) {
      localStorage.removeItem("cachedWorkspace");
      setPreviousWorkspace(null);
      setActiveWorkspace(null);
      setWorkspaces([]);
      setHasLoadedWorkspaceOnce(false);
    }
  }, [data, session, navigate, activeWorkspace, hasLoadedWorkspaceOnce]);

  const refreshWorkspaces = async () => {
    await queryClient.invalidateQueries({ queryKey: ['workspace'] });
  };

  const createDefaultWorkspace = async (
    customWorkspaceName?: string,
    customIcon?: string
  ): Promise<Workspace | null> => {
    try {
      setCreationError(null);
      if (!session) return null;

      let workspaceName: string;
      if (customWorkspaceName) {
        workspaceName = customWorkspaceName;
      } else {
        workspaceName = 'My Workspace';
        try {
          const { data: userMeta } = await supabase.auth.getUser();
          const firstName = userMeta?.user?.user_metadata?.firstName;
          if (firstName) {
            workspaceName = `${firstName}'s Workspace`;
          } else {
            const email = session.user.email || '';
            const username = email.split('@')[0];
            workspaceName = `${username}'s Workspace`;
          }
        } catch {
          /* ignore */
        }
      }

      const workspaceIcon = customIcon || 'building';

      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({ name: workspaceName, icon: workspaceIcon, owner_id: session.user.id })
        .select()
        .single();
      if (workspaceError) {
        setCreationError(workspaceError.message);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to create workspace.' });
        throw workspaceError;
      }

      await supabase
        .from('profiles')
        .update({ current_workspace_id: workspace.id })
        .eq('id', session.user.id);

      const newWorkspace = { id: workspace.id, name: workspace.name, icon: workspace.icon || 'building' };
      setWorkspaces((prev) => [...prev, newWorkspace]);
      setPreviousWorkspace(activeWorkspace);
      setActiveWorkspace(newWorkspace);
      localStorage.setItem('cachedWorkspace', JSON.stringify(newWorkspace));
      toast({ title: 'Workspace created', description: `Workspace "${workspaceName}" created` });
      await refreshWorkspaces();
      return newWorkspace;
    } catch (error: any) {
      setCreationError(error.message || 'Unknown error');
      return null;
    }
  };

  const switchWorkspace = async (workspace: Workspace) => {
    try {
      if (!session) return;
      const { error } = await supabase
        .from('profiles')
        .update({ current_workspace_id: workspace.id })
        .eq('id', session.user.id);
      if (error) throw error;
      setPreviousWorkspace(activeWorkspace);
      setActiveWorkspace(workspace);
      localStorage.setItem('cachedWorkspace', JSON.stringify(workspace));
      toast({ title: 'Workspace switched', description: `Switched to ${workspace.name}` });
      await refreshWorkspaces();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to switch workspace' });
    }
  };

  const isWorkspaceReady = Boolean(activeWorkspace?.id || previousWorkspace?.id);

  const value: WorkspaceContextType = {
    currentWorkspace: activeWorkspace || previousWorkspace,
    workspaces,
    isLoading,
    isWorkspaceReady,
    hasLoadedWorkspaceOnce,
    switchWorkspace,
    refreshWorkspaces,
    createDefaultWorkspace,
    creationError,
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
