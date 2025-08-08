import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { useMemo } from "react";

export interface Workspace {
  id: string;
  name: string;
  icon: string;
}

interface CreateParams {
  name?: string;
  icon?: string;
}

export function useWorkspace() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const fetchWorkspaces = async (): Promise<Workspace[]> => {
    if (!session) return [];
    const { data: memberData, error: memberError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", session.user.id);
    if (memberError) throw memberError;
    if (!memberData || memberData.length === 0) return [];
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .in("id", memberData.map((m) => m.workspace_id));
    if (error) throw error;
    return data.map((w) => ({ id: w.id, name: w.name, icon: w.icon || "building" }));
  };

  const workspacesQuery = useQuery({
    queryKey: ["workspaces", session?.user.id],
    queryFn: fetchWorkspaces,
    enabled: !!session,
    retry: 3,
  });

  const switchWorkspace = useMutation({
    mutationFn: async (workspace: Workspace) => {
      if (!session) throw new Error("No session");
      const { error } = await supabase
        .from("profiles")
        .update({ current_workspace_id: workspace.id })
        .eq("id", session.user.id);
      if (error) throw error;
      localStorage.setItem("cachedWorkspace", JSON.stringify(workspace));
      return workspace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", session?.user.id] });
    },
  });

  const createDefaultWorkspace = useMutation({
    mutationFn: async (params: CreateParams = {}): Promise<Workspace> => {
      // Force refresh the active session
      const { data: { session: refreshedSession }, error: sessionError } = await supabase.auth.refreshSession();
      
      if (sessionError) {
        console.error("Session refresh error:", sessionError);
        throw new Error("Failed to refresh session");
      }
      
      if (!refreshedSession) {
        throw new Error("No valid session found after refresh");
      }
      
      console.log("Active session refreshed, user ID:", refreshedSession.user.id);
      
      const workspaceName = params.name || "My Workspace";
      
      // DEBUG: Check Supabase auth context before workspace insert
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log("=== AUTH DEBUG ===");
      console.log("Auth user object:", user);
      console.log("User ID:", user?.id);
      console.log("Auth error (if any):", userError);
      console.log("==================");
      
      // Now perform the INSERT with a refreshed session context
      const { data, error } = await supabase
        .from("workspaces")
        .insert({
          name: workspaceName,
          icon: params.icon || "building",
        } as any)
        .select()
        .single();
        
      if (error) {
        console.error("Workspace creation error:", error);
        throw error;
      }
      
      console.log("Workspace created successfully:", data);
      
      // Add the user as a member of the new workspace
      const { error: memberError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: data.id,
          user_id: refreshedSession.user.id, // Use refreshed session
          role: "owner"
        });
        
      if (memberError) {
        console.error("Failed to add user as workspace member:", memberError);
        throw memberError;
      }
      
      // Update user's current workspace
      await supabase
        .from("profiles")
        .update({ current_workspace_id: data.id })
        .eq("id", refreshedSession.user.id); // Use refreshed session
      
      const workspace = {
        id: data.id,
        name: data.name,
        icon: data.icon || "building",
      };
      
      localStorage.setItem("cachedWorkspace", JSON.stringify(workspace));
      return workspace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", session?.user.id] });
    },
  });

  const currentWorkspace = useMemo(() => {
    const cached = localStorage.getItem("cachedWorkspace");
    const fromCache = cached ? (JSON.parse(cached) as Workspace) : null;
    if (workspacesQuery.data && workspacesQuery.data.length > 0) {
      return (
        workspacesQuery.data.find((w) => w.id === fromCache?.id) ||
        workspacesQuery.data[0]
      );
    }
    return fromCache;
  }, [workspacesQuery.data]);

  const refreshWorkspaces = () =>
    queryClient.invalidateQueries({ queryKey: ["workspaces", session?.user.id] });

  return {
    currentWorkspace,
    workspaces: workspacesQuery.data || [],
    isLoading: workspacesQuery.isLoading,
    isWorkspaceReady: !!currentWorkspace,
    hasLoadedWorkspaceOnce: workspacesQuery.isSuccess,
    switchWorkspace: switchWorkspace.mutateAsync,
    refreshWorkspaces,
    createDefaultWorkspace: createDefaultWorkspace.mutateAsync,
    creationError: createDefaultWorkspace.isError
      ? (createDefaultWorkspace.error as Error).message
      : null,
    error: workspacesQuery.error as Error | null,
  };
}
