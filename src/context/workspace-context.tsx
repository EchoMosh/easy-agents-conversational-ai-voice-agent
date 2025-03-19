
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  creationError: string | null;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creationError, setCreationError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchWorkspaces = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching workspaces...");
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

      if (memberError) {
        console.error("Error fetching workspace members:", memberError);
        // If there's an error fetching workspace members, navigate to onboarding
        if (memberError.code === '42P17') {
          setCreationError("Database policy issue detected. Please contact support.");
          navigate('/onboarding');
          setIsLoading(false);
          return;
        }
        throw memberError;
      }

      if (!memberData || memberData.length === 0) {
        console.log("No workspaces found, redirecting to onboarding");
        setIsLoading(false);
        navigate('/onboarding');
        return;
      }

      const workspaceIds = memberData.map(m => m.workspace_id);

      // Get workspace details
      const { data: workspacesData, error: workspacesError } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', workspaceIds);

      if (workspacesError) {
        console.error("Error fetching workspaces:", workspacesError);
        throw workspacesError;
      }

      // Get current workspace from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('current_workspace_id')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching profile:", profileError);
        throw profileError;
      }

      const mappedWorkspaces = workspacesData.map(w => ({
        id: w.id,
        name: w.name,
        icon: w.icon || 'building',
      }));

      console.log("Fetched workspaces:", mappedWorkspaces);
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
      setCreationError(null);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return null;

      // Generate a default workspace name based on the user's email
      const email = session.user.email || '';
      const username = email.split('@')[0];
      const defaultWorkspaceName = `${username}'s Workspace`;

      console.log("Creating default workspace:", defaultWorkspaceName);

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

      if (workspaceError) {
        console.error("Workspace creation error:", workspaceError);
        setCreationError(workspaceError.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create default workspace. Please try again later.",
        });
        throw workspaceError;
      }

      console.log("Workspace created:", workspace);

      // Add the user as an owner
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: session.user.id,
          role: 'owner'
        });

      if (memberError) {
        console.error("Member addition error:", memberError);
        setCreationError(memberError.message);
        if (memberError.code === '42P17') {
          toast({
            variant: "destructive",
            title: "Database Policy Error",
            description: "There seems to be an issue with database policies. Please contact support.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to add you to the workspace. Please try again later.",
          });
        }
        throw memberError;
      }

      // Set as current workspace
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ current_workspace_id: workspace.id })
        .eq('id', session.user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        setCreationError(profileError.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to set current workspace. Please try again later.",
        });
        throw profileError;
      }

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
    } catch (error: any) {
      console.error('Error creating default workspace:', error);
      setCreationError(error.message || "Unknown error");
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
    creationError,
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
