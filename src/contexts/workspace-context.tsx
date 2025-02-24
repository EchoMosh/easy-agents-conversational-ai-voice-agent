
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Workspace {
  id: string;
  name: string;
  created_at: string;
  owner_id: string;
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  isLoading: boolean;
  createWorkspace: (name: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const refreshWorkspaces = async () => {
    try {
      // First, get workspaces where the user is a member
      const { data: memberWorkspaces, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (memberError) throw memberError;

      // Then get the actual workspace data
      const workspaceIds = memberWorkspaces.map(w => w.workspace_id);
      
      if (workspaceIds.length > 0) {
        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .in('id', workspaceIds)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setWorkspaces(data);
        
        // Set first workspace as current if none is selected
        if (!currentWorkspace && data.length > 0) {
          setCurrentWorkspace(data[0]);
        }
      } else {
        setWorkspaces([]);
        setCurrentWorkspace(null);
      }

      setIsLoading(false);
    } catch (error: any) {
      console.error('Error fetching workspaces:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load workspaces",
      });
    }
  };

  const createWorkspace = async (name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First create the workspace
      const { data: workspace, error: createError } = await supabase
        .from('workspaces')
        .insert({
          name,
          owner_id: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Then add the user as a workspace member
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      await refreshWorkspaces();
      setCurrentWorkspace(workspace);

      toast({
        title: "Success",
        description: "Workspace created successfully",
      });
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create workspace",
      });
    }
  };

  useEffect(() => {
    refreshWorkspaces();
  }, []);

  return (
    <WorkspaceContext.Provider value={{
      currentWorkspace,
      workspaces,
      setCurrentWorkspace,
      isLoading,
      createWorkspace,
      refreshWorkspaces,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
