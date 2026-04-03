import { useState, useEffect, useCallback } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/context/workspace-context";
import { Button } from "@/components/ui/button";
import { Plus, Phone, Loader2, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AddPhoneNumberDialog } from "@/components/phone-numbers/add-phone-number-dialog";
import { PhoneNumberAgentSelector } from "@/components/phone-numbers/phone-number-agent-selector";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPhoneNumber } from "@/utils/phone-number-utils";
import type { Tables } from "@/integrations/supabase/types";

type PhoneNumber = Tables<"phone_numbers"> & {
  inbound_agent?: Pick<Tables<"agents">, "id" | "name" | "v_agent_id"> | null;
  outbound_agent?: Pick<Tables<"agents">, "id" | "name" | "v_agent_id"> | null;
};

type Agent = Pick<Tables<"agents">, "id" | "name" | "role">;

export const PhoneNumbersPage = () => {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const { toast } = useToast();
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [releaseDialog, setReleaseDialog] = useState<{
    open: boolean;
    phoneNumber?: PhoneNumber;
  }>({ open: false });

  const fetchData = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch phone numbers and agents in parallel
      const [phoneResult, agentsResult] = await Promise.all([
        supabase
          .from("phone_numbers")
          .select(
            `
            *,
            inbound_agent:agents!phone_numbers_inbound_agent_id_fkey(
              id,
              name,
              v_agent_id
            ),
            outbound_agent:agents!phone_numbers_outbound_agent_id_fkey(
              id,
              name,
              v_agent_id
            )
          `,
          )
          .eq("workspace_id", workspaceId)
          .neq("status", "released")
          .order("created_at", { ascending: false }),
        supabase
          .from("agents")
          .select("id, name, role")
          .eq("workspace_id", workspaceId)
          .eq("is_active", true)
          .order("name"),
      ]);

      if (phoneResult.error) throw phoneResult.error;
      if (agentsResult.error) throw agentsResult.error;

      setPhoneNumbers(phoneResult.data || []);
      setAgents(agentsResult.data || []);
    } catch (err) {
      console.error("Error fetching phone numbers data:", err);
      const message =
        err instanceof Error ? err.message : "Failed to load phone numbers";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateAgents = async (
    phoneNumberId: string,
    type: "inbound" | "outbound",
    agentId: string | null,
  ) => {
    try {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) return;

      const updateData: Record<string, unknown> = {
        phoneNumberId,
      };

      if (type === "inbound") {
        updateData.inboundAgentId = agentId;
      } else {
        updateData.outboundAgentId = agentId;
      }

      const response = await supabase.functions.invoke(
        "update-phone-number-agents",
        {
          body: updateData,
          headers: {
            Authorization: `Bearer ${authData.session.access_token}`,
          },
        },
      );

      if (response.error) {
        const msg = response.data?.error || response.error.message;
        throw new Error(msg || "Failed to update agent");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "Success",
        description: `${type === "inbound" ? "Inbound" : "Outbound"} agent updated`,
      });

      await fetchData();
    } catch (err) {
      console.error("Error updating agent:", err);
      toast({
        title: "Error",
        description: "Failed to update agent assignment",
        variant: "destructive",
      });
    }
  };

  const handleReleaseNumber = async () => {
    if (!releaseDialog.phoneNumber) return;

    try {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) return;

      const response = await supabase.functions.invoke("release-phone-number", {
        body: { phoneNumberId: releaseDialog.phoneNumber.id },
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Success",
        description: "Phone number released successfully",
      });

      setReleaseDialog({ open: false });
      await fetchData();
    } catch (err) {
      console.error("Error releasing number:", err);
      toast({
        title: "Error",
        description: "Failed to release phone number",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={fetchData}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Phone Numbers</h1>
          <p className="text-muted-foreground">
            Manage phone numbers for your voice agents
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Phone Number
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone Number</TableHead>
              <TableHead>Friendly Name</TableHead>
              <TableHead>Inbound Agent</TableHead>
              <TableHead>Outbound Agent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {phoneNumbers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Phone className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No phone numbers yet. Add one to get started.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              phoneNumbers.map((phoneNumber) => (
                <TableRow key={phoneNumber.id}>
                  <TableCell className="font-medium">
                    {phoneNumber.twilio_phone_number ? (
                      formatPhoneNumber(phoneNumber.twilio_phone_number)
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Virtual (outbound only)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{phoneNumber.friendly_name || "-"}</TableCell>
                  <TableCell>
                    <PhoneNumberAgentSelector
                      workspaceId={workspaceId!}
                      selectedAgentId={phoneNumber.inbound_agent_id}
                      onAgentChange={(agentId) =>
                        handleUpdateAgents(phoneNumber.id, "inbound", agentId)
                      }
                      placeholder="Select inbound agent"
                      agents={agents}
                    />
                  </TableCell>
                  <TableCell>
                    <PhoneNumberAgentSelector
                      workspaceId={workspaceId!}
                      selectedAgentId={phoneNumber.outbound_agent_id}
                      onAgentChange={(agentId) =>
                        handleUpdateAgents(phoneNumber.id, "outbound", agentId)
                      }
                      placeholder="Select outbound agent"
                      agents={agents}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        phoneNumber.status === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {phoneNumber.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        setReleaseDialog({ open: true, phoneNumber })
                      }
                    >
                      Release
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddPhoneNumberDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        workspaceId={workspaceId!}
        onSuccess={() => {
          setAddDialogOpen(false);
          fetchData();
        }}
      />

      <AlertDialog
        open={releaseDialog.open}
        onOpenChange={(open) => setReleaseDialog({ open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Release Phone Number</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to release{" "}
              <strong>
                {releaseDialog.phoneNumber &&
                  formatPhoneNumber(
                    releaseDialog.phoneNumber.twilio_phone_number,
                  )}
              </strong>
              ? This action cannot be undone and the number will no longer be
              available for your agents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReleaseNumber}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Release Number
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
