import { useState } from "react";
import { 
  Building2, 
  Briefcase, 
  Globe, 
  Home, 
  Factory, 
  ChevronsUpDown,
  Plus,
  Check,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconSelector } from "./icon-selector";
import { useWorkspace } from "@/context/workspace-context";
import { useSidebar } from "@/components/ui/sidebar";

const iconMap = {
  building: Building2,
  briefcase: Briefcase,
  globe: Globe,
  house: Home,
  factory: Factory,
};

export function WorkspaceSwitcher() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewWorkspaceDialog, setShowNewWorkspaceDialog] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceIcon, setNewWorkspaceIcon] = useState("building");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { 
    currentWorkspace, 
    workspaces, 
    isLoading, 
    switchWorkspace, 
    refreshWorkspaces 
  } = useWorkspace();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Workspace name is required",
      });
      return;
    }

    try {
      setIsCreating(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: newWorkspaceName,
          icon: newWorkspaceIcon,
          owner_id: session.user.id
        })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ current_workspace_id: workspace.id })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      toast({
        title: "Success",
        description: "Workspace created successfully",
      });

      await refreshWorkspaces();
      
      setShowNewWorkspaceDialog(false);
      setNewWorkspaceName("");
      setNewWorkspaceIcon("building");
      
      window.location.reload();
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create workspace",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Building2;
    return <IconComponent />;
  };

  if (isLoading) {
    return (
      <div className="p-3 flex items-center gap-2">
        <div className="h-10 w-10 flex items-center justify-center rounded-md bg-black text-white">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="flex-1 group-data-[collapsible=icon]:hidden">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
        <DropdownMenuTrigger asChild>
          <button
            className={`flex w-full items-center gap-2 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 ${isCollapsed ? "justify-center" : ""}`}
          >
            {currentWorkspace ? (
              <>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-black text-white">
                  {getIconComponent(currentWorkspace.icon)}
                </div>
                <div className={`flex-1 min-w-0 text-left ${isCollapsed ? "hidden" : ""}`}>
                  <div className="text-base font-medium truncate">
                    {currentWorkspace.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    Workspace
                  </div>
                </div>
                <ChevronsUpDown className={`h-4 w-4 text-gray-500 flex-shrink-0 ${isCollapsed ? "hidden" : "ml-auto"}`} />
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-black text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className={`flex-1 min-w-0 text-left ${isCollapsed ? "hidden" : ""}`}>
                  <div className="text-base font-medium truncate">No Workspace</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    Create one to get started
                  </div>
                </div>
                <ChevronsUpDown className={`h-4 w-4 text-gray-500 flex-shrink-0 ${isCollapsed ? "hidden" : "ml-auto"}`} />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[280px]">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>

          {workspaces.length > 0 ? (
            workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                className="flex items-center gap-2 py-2"
                onClick={() => switchWorkspace(workspace)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md border">
                  {getIconComponent(workspace.icon)}
                </div>
                <span className="truncate flex-1 min-w-0">{workspace.name}</span>
                {currentWorkspace?.id === workspace.id && (
                  <Check className="ml-auto h-4 w-4 flex-shrink-0" />
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-2 py-2 text-sm text-gray-500">
              No workspaces found
            </div>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="flex items-center gap-2 py-2"
            onClick={() => setShowNewWorkspaceDialog(true)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md border">
              <Plus className="h-4 w-4" />
            </div>
            <span>Create workspace</span>
          </DropdownMenuItem>
          
          {currentWorkspace && (
            <DropdownMenuItem className="flex items-center gap-2 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border">
                <Settings className="h-4 w-4" />
              </div>
              <span>Workspace settings</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showNewWorkspaceDialog} onOpenChange={setShowNewWorkspaceDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              Create a new workspace to organize your leads, agents, and resources.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Workspace name
              </label>
              <Input
                id="name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="My Workspace"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Workspace icon
              </label>
              <IconSelector 
                value={newWorkspaceIcon} 
                onChange={setNewWorkspaceIcon} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNewWorkspaceDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWorkspace}
              disabled={isCreating || !newWorkspaceName.trim()}
            >
              {isCreating ? "Creating..." : "Create workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
