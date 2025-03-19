
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Workspace {
  id: string;
  name: string;
  icon: string;
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  switchWorkspace: (workspace: Workspace) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  createDefaultWorkspace: () => Promise<Workspace | null>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchWorkspaces = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsLoading(false);
        return;
      }

      // Get all workspaces user is a member of
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', session.user.id);

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        setIsLoading(false);
        return;
      }

      const workspaceIds = memberData.map(m => m.workspace_id);

      // Get workspace details
      const { data: workspacesData, error: workspacesError } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', workspaceIds);

      if (workspacesError) throw workspacesError;

      // Get current workspace from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('current_workspace_id')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      const mappedWorkspaces = workspacesData.map(w => ({
        id: w.id,
        name: w.name,
        icon: w.icon || 'building',
      }));

      setWorkspaces(mappedWorkspaces);

      if (profile?.current_workspace_id) {
        const current = mappedWorkspaces.find(w => w.id === profile.current_workspace_id);
        if (current) {
          setCurrentWorkspace(current);
        } else if (mappedWorkspaces.length > 0) {
          setCurrentWorkspace(mappedWorkspaces[0]);
          // Update the current workspace if it's not set
          await supabase
            .from('profiles')
            .update({ current_workspace_id: mappedWorkspaces[0].id })
            .eq('id', session.user.id);
        }
      } else if (mappedWorkspaces.length > 0) {
        setCurrentWorkspace(mappedWorkspaces[0]);
        // Set the first workspace as current if none is set
        await supabase
          .from('profiles')
          .update({ current_workspace_id: mappedWorkspaces[0].id })
          .eq('id', session.user.id);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultWorkspace = async (): Promise<Workspace | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return null;

      // Generate a default workspace name based on the user's email
      const email = session.user.email || '';
      const username = email.split('@')[0];
      const defaultWorkspaceName = `${username}'s Workspace`;

      // Create the new workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: defaultWorkspaceName,
          icon: 'building',
          owner_id: session.user.id
        })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      // Add the user as an owner
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: session.user.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      // Set as current workspace
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ current_workspace_id: workspace.id })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      const newWorkspace = {
        id: workspace.id,
        name: workspace.name,
        icon: workspace.icon || 'building',
      };

      // Update local state
      setWorkspaces(prev => [...prev, newWorkspace]);
      setCurrentWorkspace(newWorkspace);

      toast({
        title: "Workspace created",
        description: `Default workspace "${defaultWorkspaceName}" created`,
      });

      return newWorkspace;
    } catch (error) {
      console.error('Error creating default workspace:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create default workspace",
      });
      return null;
    }
  };

  const switchWorkspace = async (workspace: Workspace) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      // Update the current workspace in the profile
      const { error } = await supabase
        .from('profiles')
        .update({ current_workspace_id: workspace.id })
        .eq('id', session.user.id);

      if (error) throw error;

      setCurrentWorkspace(workspace);
      
      toast({
        title: "Workspace switched",
        description: `Switched to ${workspace.name}`,
      });
    } catch (error) {
      console.error('Error switching workspace:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to switch workspace",
      });
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const value = {
    currentWorkspace,
    workspaces,
    isLoading,
    switchWorkspace,
    refreshWorkspaces: fetchWorkspaces,
    createDefaultWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
