import { useState, useEffect } from "react";
import { useWorkspace } from "@/context/workspace-context";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Save,
  AlertCircle,
  Building,
  Home,
  Briefcase,
  Rocket,
  Users,
  Bot,
  Sparkles,
  Zap,
  X,
} from "lucide-react";

// Icons available for workspaces
const workspaceIcons = [
  { id: "building", icon: Building, label: "Building" },
  { id: "home", icon: Home, label: "Home" },
  { id: "briefcase", icon: Briefcase, label: "Briefcase" },
  { id: "rocket", icon: Rocket, label: "Rocket" },
  { id: "users", icon: Users, label: "Team" },
  { id: "bot", icon: Bot, label: "Bot" },
  { id: "sparkles", icon: Sparkles, label: "Sparkles" },
  { id: "zap", icon: Zap, label: "Lightning" },
];

export function WorkspaceSettings() {
  const { currentWorkspace, refreshWorkspaces } = useWorkspace();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceIcon, setWorkspaceIcon] = useState("");

  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceName(currentWorkspace.name);
      setWorkspaceIcon(currentWorkspace.icon);
    }
  }, [currentWorkspace]);

  const handleUpdateWorkspace = async () => {
    if (!currentWorkspace) return;

    try {
      setIsEditing(true);

      if (!workspaceName.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Workspace name cannot be empty",
        });
        return;
      }

      const { error } = await supabase
        .from("workspaces")
        .update({
          name: workspaceName,
          icon: workspaceIcon,
        })
        .eq("id", currentWorkspace.id);

      if (error) throw error;

      await refreshWorkspaces();

      toast({
        title: "Success",
        description: "Workspace settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating workspace:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update workspace settings",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace) return;

    try {
      setIsDeleting(true);

      // Check if this is the only workspace
      const { data: workspaces, error: fetchError } = await supabase
        .from("workspaces")
        .select("id");

      if (fetchError) throw fetchError;

      if (workspaces.length <= 1) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "You cannot delete your only workspace. Create a new workspace first.",
        });
        return;
      }

      // Prepare a batch delete operation using Supabase functions
      console.log("Deleting workspace:", currentWorkspace.id);

      // Get the current user's profile to update current_workspace_id later
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      // Find another workspace to switch to
      const otherWorkspace = workspaces.find(
        (ws) => ws.id !== currentWorkspace.id
      );
      if (!otherWorkspace) {
        throw new Error("Could not find another workspace to switch to");
      }

      // 1. Update user's current_workspace_id to another workspace
      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({ current_workspace_id: otherWorkspace.id })
        .eq("id", session.user.id);

      if (updateProfileError) {
        console.error("Error updating profile:", updateProfileError);
        // Continue with deletion anyway
      }

      // 2. Try to delete with foreign key constraints handled by the database
      const { error: deleteError } = await supabase
        .from("workspaces")
        .delete()
        .eq("id", currentWorkspace.id);

      if (deleteError) {
        console.error("Workspace delete error:", deleteError);

        // If direct delete failed, try to delete related data first
        // Delete agents if the table has workspace_id column
        await supabase
          .from("agents")
          .delete()
          .eq("workspace_id", currentWorkspace.id)
          .then((res) => {
            if (res.error) {
              console.warn("Could not delete workspace agents:", res.error);
            } else {
              console.log("Deleted workspace agents");
            }
          });

        // Delete workspace members
        await supabase
          .from("workspace_members")
          .delete()
          .eq("workspace_id", currentWorkspace.id)
          .then((res) => {
            if (res.error) {
              console.warn("Could not delete workspace members:", res.error);
            } else {
              console.log("Deleted workspace members");
            }
          });

        // Try to delete the workspace again
        const { error: secondDeleteError } = await supabase
          .from("workspaces")
          .delete()
          .eq("id", currentWorkspace.id);

        if (secondDeleteError) {
          throw secondDeleteError;
        }
      }

      // Refresh workspaces to update the state
      await refreshWorkspaces();

      toast({
        title: "Success",
        description: "Workspace deleted successfully",
      });

      // Redirect to the dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Error deleting workspace:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Failed to delete workspace. Please try again or contact support.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const IconComponent =
    workspaceIcons.find((icon) => icon.id === workspaceIcon)?.icon || Building;

  if (!currentWorkspace) {
    return (
      <div className="text-center py-8">
        <p>No workspace selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-6">Workspace Settings</h2>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <IconComponent className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium">{currentWorkspace.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your workspace settings
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input
                  id="workspace-name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Enter workspace name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workspace-icon">Workspace Icon</Label>
                <Select value={workspaceIcon} onValueChange={setWorkspaceIcon}>
                  <SelectTrigger id="workspace-icon" className="w-full">
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaceIcons.map((icon) => (
                      <SelectItem
                        key={icon.id}
                        value={icon.id}
                        className="flex items-center gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <icon.icon className="h-4 w-4" />
                          <span>{icon.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="default"
                onClick={handleUpdateWorkspace}
                disabled={isEditing}
                className="gap-2"
              >
                {isEditing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Danger Zone</h3>
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Delete Workspace
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Permanently delete this workspace and all its data. This
                  action cannot be undone.
                </p>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2 shrink-0">
                    <Trash2 className="h-4 w-4" />
                    Delete Workspace
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete the workspace "
                      {currentWorkspace.name}" and all its data, including
                      agents, leads, and settings.
                      <br />
                      <br />
                      <span className="font-semibold">
                        This action cannot be undone.
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteWorkspace}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete Workspace
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
