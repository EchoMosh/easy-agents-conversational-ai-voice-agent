import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { LoadingPriority, useAppLoading } from "./app-loading-context";
import { useApiLoading } from "@/hooks/use-api-loading";

interface Workspace {
  id: string;
  name: string;
  icon: string;
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  isWorkspaceReady: boolean; // Add a flag that other components can check
  hasLoadedWorkspaceOnce: boolean; // To track initial full load
  switchWorkspace: (workspace: Workspace) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  createDefaultWorkspace: (
    customWorkspaceName?: string,
    customIcon?: string
  ) => Promise<Workspace | null>;
  creationError: string | null;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const cachedWorkspace = localStorage.getItem('cachedWorkspace');
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(
    cachedWorkspace ? JSON.parse(cachedWorkspace) : null
  );
  const [previousWorkspace, setPreviousWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedWorkspaceOnce, setHasLoadedWorkspaceOnce] = useState(false); // New state
  const [creationError, setCreationError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Use register loading state directly from app-loading-context
  // This is safe because it properly handles hooks at the component level
  const { registerLoadingState, unregisterLoadingState } = useAppLoading();

  // Register the workspace loading state
  useEffect(() => {
    // Register the loading state with dynamic priority
    const priority = hasLoadedWorkspaceOnce ? LoadingPriority.MEDIUM : LoadingPriority.HIGH;
    registerLoadingState("workspace", isLoading, priority);

    // Log the current loading state for debugging
    console.log(`Workspace loading state: ${isLoading ? "loading" : "loaded"} with priority: ${priority}`);

    // Clean up on unmount
    return () => {
      unregisterLoadingState("workspace");
    };
  }, [isLoading, registerLoadingState, unregisterLoadingState, hasLoadedWorkspaceOnce]);

  const fetchWorkspaces = async (retryCount = 0, maxRetries = 3) => {
    try {
      setIsLoading(true);
      console.log(
        `Fetching workspaces... (attempt ${retryCount + 1}/${maxRetries + 1})`
      );
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.log("No session found, waiting for auth...");

        // If no session but we haven't reached max retries, retry after delay
        if (retryCount < maxRetries) {
          setTimeout(() => {
            fetchWorkspaces(retryCount + 1, maxRetries);
          }, 1000 * (retryCount + 1)); // Exponential backoff
          return;
        }

        setIsLoading(false);
        return;
      }

      // Get all workspaces where user is a member - using the simplified RLS policy
      const { data: memberData, error: memberError } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", session.user.id);

      if (memberError) {
        console.error("Error fetching workspace members:", memberError);
        setIsLoading(false);
        return;
      }

      if (!memberData || memberData.length === 0) {
        console.log("No workspaces found, redirecting to onboarding");
        setIsLoading(false);

        // Ensure we're not in a loop - use local storage to prevent infinite redirects
        const redirectAttempt = localStorage.getItem(
          "workspaceRedirectAttempt"
        );
        const now = Date.now();

        if (!redirectAttempt || now - parseInt(redirectAttempt) > 30000) {
          // 30 seconds threshold
          localStorage.setItem("workspaceRedirectAttempt", now.toString());
          navigate("/onboarding");
        }
        return;
      }

      const workspaceIds = memberData.map((m) => m.workspace_id);

      // Get workspace details
      const { data: workspacesData, error: workspacesError } = await supabase
        .from("workspaces")
        .select("*")
        .in("id", workspaceIds);

      if (workspacesError) {
        console.error("Error fetching workspaces:", workspacesError);

        // Retry if we haven't reached max retries
        if (retryCount < maxRetries) {
          setTimeout(() => {
            fetchWorkspaces(retryCount + 1, maxRetries);
          }, 1000 * (retryCount + 1)); // Exponential backoff
          return;
        }

        throw workspacesError;
      }

      // Get current workspace from profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("current_workspace_id")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching profile:", profileError);
        throw profileError;
      }

      const mappedWorkspaces = workspacesData.map((w) => ({
        id: w.id,
        name: w.name,
        icon: w.icon || "building",
      }));

      console.log("Fetched workspaces:", mappedWorkspaces);
      setWorkspaces(mappedWorkspaces);

      if (profile?.current_workspace_id) {
        const current = mappedWorkspaces.find(
          (w) => w.id === profile.current_workspace_id
        );
        if (current) {
          setPreviousWorkspace(activeWorkspace);
          setActiveWorkspace(current);
          if (current) {
            setHasLoadedWorkspaceOnce(true); // Set flag
            localStorage.setItem('cachedWorkspace', JSON.stringify(current)); // Cache workspace
          }
        } else if (mappedWorkspaces.length > 0) {
          setPreviousWorkspace(activeWorkspace);
          setActiveWorkspace(mappedWorkspaces[0]);
          if (mappedWorkspaces[0]) {
            setHasLoadedWorkspaceOnce(true); // Set flag
            localStorage.setItem('cachedWorkspace', JSON.stringify(mappedWorkspaces[0])); // Cache workspace
          }
          // Update the current workspace if it's not set
          await supabase
            .from("profiles")
            .update({ current_workspace_id: mappedWorkspaces[0].id })
            .eq("id", session.user.id);
        }
      } else if (mappedWorkspaces.length > 0) {
        setPreviousWorkspace(activeWorkspace);
        setActiveWorkspace(mappedWorkspaces[0]);
        if (mappedWorkspaces[0]) {
          setHasLoadedWorkspaceOnce(true); // Set flag
          localStorage.setItem('cachedWorkspace', JSON.stringify(mappedWorkspaces[0])); // Cache workspace
        }
        // Set the first workspace as current if none is set
        await supabase
          .from("profiles")
          .update({ current_workspace_id: mappedWorkspaces[0].id })
          .eq("id", session.user.id);
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error);

      // Retry if we haven't reached max retries
      if (retryCount < maxRetries) {
        const retryDelay = 1000 * (retryCount + 1); // Exponential backoff
        console.log(`Retrying workspace fetch in ${retryDelay}ms...`);

        setTimeout(() => {
          fetchWorkspaces(retryCount + 1, maxRetries);
        }, retryDelay);
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultWorkspace = async (
    customWorkspaceName?: string,
    customIcon?: string
  ): Promise<Workspace | null> => {
    try {
      setCreationError(null);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return null;

      // Use the custom workspace name if provided
      let workspaceName: string;

      if (customWorkspaceName) {
        workspaceName = customWorkspaceName;
      } else {
        // Generate a default workspace name based on the user's email or user metadata
        workspaceName = "My Workspace";

        try {
          // First try to get the name from the user metadata
          const { data: userMeta } = await supabase.auth.getUser();
          const firstName = userMeta?.user?.user_metadata?.firstName;
          const lastName = userMeta?.user?.user_metadata?.lastName;

          if (firstName) {
            workspaceName = `${firstName}'s Workspace`;
          } else {
            // Fall back to using email
            const email = session.user.email || "";
            const username = email.split("@")[0];
            workspaceName = `${username}'s Workspace`;
          }
        } catch (error) {
          console.error("Error getting user metadata:", error);
          // Continue with the default name
        }
      }

      // Use custom icon if provided
      const workspaceIcon = customIcon || "building";

      console.log("Creating workspace:", workspaceName);

      // Create the workspace with the user as owner
      // The database trigger will automatically add the user as a member
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .insert({
          name: workspaceName,
          icon: workspaceIcon,
          owner_id: session.user.id,
        })
        .select()
        .single();

      if (workspaceError) {
        console.error("Workspace creation error:", workspaceError);
        setCreationError(workspaceError.message);

        toast({
          variant: "destructive",
          title: "Error",
          description:
            "Failed to create default workspace. Please try again later.",
        });

        throw workspaceError;
      }

      console.log("Workspace created:", workspace);

      // Set as current workspace
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ current_workspace_id: workspace.id })
        .eq("id", session.user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        // Continue anyway as we've at least created the workspace
      } else {
        console.log("Profile updated with current workspace");
      }

      // Create the workspace object for the state
      const newWorkspace = {
        id: workspace.id,
        name: workspace.name,
        icon: workspace.icon || "building",
      };

      // Update local state
      setWorkspaces((prev) => [...prev, newWorkspace]);
      setPreviousWorkspace(activeWorkspace);
      setActiveWorkspace(newWorkspace);
      if (newWorkspace) {
        localStorage.setItem('cachedWorkspace', JSON.stringify(newWorkspace)); // Cache new workspace
      }

      toast({
        title: "Workspace created",
        description: `Workspace "${workspaceName}" created`,
      });

      return newWorkspace;
    } catch (error: any) {
      console.error("Error creating default workspace:", error);
      setCreationError(error.message || "Unknown error");
      return null;
    }
  };

  const switchWorkspace = async (workspace: Workspace) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      // Update the current workspace in the profile
      const { error } = await supabase
        .from("profiles")
        .update({ current_workspace_id: workspace.id })
        .eq("id", session.user.id);

      if (error) throw error;

      setPreviousWorkspace(activeWorkspace);
      setActiveWorkspace(workspace);
      if (workspace) {
        localStorage.setItem('cachedWorkspace', JSON.stringify(workspace)); // Cache switched workspace
      }

      toast({
        title: "Workspace switched",
        description: `Switched to ${workspace.name}`,
      });
    } catch (error) {
      console.error("Error switching workspace:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to switch workspace",
      });
    }
  };

  // Custom hook to check if workspace is ready
  const isWorkspaceReady = Boolean(activeWorkspace?.id || previousWorkspace?.id);

  // Initialize workspace loading when the app starts
  useEffect(() => {
    // Clear any previous redirect attempts when mounting
    localStorage.removeItem("workspaceRedirectAttempt");

    // Keep track of last auth event time to prevent duplicates
    let lastAuthEventTime = 0;
    const MIN_EVENT_INTERVAL = 2000; // 2 seconds minimum between events
    let isAuthenticated = !!activeWorkspace; // Initialize based on cached workspace

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const now = Date.now();
      console.log(`[Auth Debug] Auth event: ${event}, session: ${!!session}, time since last: ${now - lastAuthEventTime}ms, isAuthenticated: ${isAuthenticated}`);

      if (event === "SIGNED_IN") {
        if (session && (now - lastAuthEventTime > MIN_EVENT_INTERVAL || !isAuthenticated)) {
          console.log("User signed in (genuine sign-in event or initial load), fetching workspaces...");
          isAuthenticated = true;
          fetchWorkspaces();
        } else if (session && isAuthenticated) {
          console.log("Ignoring likely token refresh or duplicate SIGNED_IN event (already authenticated).");
        } else if (!session) {
          console.log("SIGNED_IN event but no session, likely an error or race condition.");
        }
      } else if (event === "TOKEN_REFRESHED") {
        console.log("Token refreshed - maintaining current workspace state. Session:", !!session);
        // Ensure isAuthenticated is true if we have a session
        if (session) isAuthenticated = true;
        // Do NOT fetch workspaces again
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out, clearing workspace state");
        isAuthenticated = false;
        localStorage.removeItem('cachedWorkspace');
        setPreviousWorkspace(null);
        setActiveWorkspace(null);
        setWorkspaces([]);
        setHasLoadedWorkspaceOnce(false); // Reset this on sign out
      }
      lastAuthEventTime = now;
    });

    // Initial fetch - only if not already loading and no active workspace from cache
    // The `isLoading` check here might be tricky due to initial state `true`.
    // `fetchWorkspaces` itself sets `isLoading = true` at the start.
    // The primary trigger for initial fetch should be the SIGNED_IN event.
    // However, we also need to handle the case where a session might already exist when the provider mounts.
    // Let's check session on mount and fetch if a session exists and no workspace is cached,
    // or if the auth listener fires SIGNED_IN.
    const checkSessionAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !activeWorkspace) { // If session exists and no workspace from cache
        console.log("Session exists on mount, no cached workspace, fetching workspaces...");
        isAuthenticated = true; // Assume authenticated if session exists
        fetchWorkspaces();
      } else if (activeWorkspace) { // If workspace from cache
        console.log("Using cached workspace initially.");
        setHasLoadedWorkspaceOnce(true);
        setIsLoading(false);
      } else { // No session, no cache
        setIsLoading(false); // Not loading if no session and no cache
      }
    };
    checkSessionAndFetch();


    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // Keep empty dependency array for single setup/cleanup

  const value = {
    currentWorkspace: activeWorkspace || previousWorkspace, // Use fallback
    workspaces,
    isLoading,
    isWorkspaceReady,
    hasLoadedWorkspaceOnce, // Expose new flag
    switchWorkspace,
    refreshWorkspaces: useCallback(() => fetchWorkspaces(0, 3), []),
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
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
