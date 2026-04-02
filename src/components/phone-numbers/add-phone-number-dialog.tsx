import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Phone,
  ArrowRight,
  Search,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { PhoneNumberAgentSelector } from "./phone-number-agent-selector";

interface AddPhoneNumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onSuccess: () => void;
}

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  capabilities: { voice: boolean; sms: boolean; mms: boolean };
}

export const AddPhoneNumberDialog = ({
  open,
  onOpenChange,
  workspaceId,
  onSuccess,
}: AddPhoneNumberDialogProps) => {
  const { toast } = useToast();
  const [twilioConnected, setTwilioConnected] = useState<boolean | null>(null);
  const [mode, setMode] = useState<
    "select" | "vapi" | "twilio-search" | "twilio-configure"
  >("select");
  const [purchasing, setPurchasing] = useState(false);
  const [searching, setSearching] = useState(false);

  // Shared fields
  const [friendlyName, setFriendlyName] = useState("");
  const [inboundAgentId, setInboundAgentId] = useState<string | null>(null);
  const [outboundAgentId, setOutboundAgentId] = useState<string | null>(null);

  // VAPI fields
  const [areaCode, setAreaCode] = useState("");

  // Twilio search fields
  const [country, setCountry] = useState("US");
  const [searchAreaCode, setSearchAreaCode] = useState("");
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>(
    [],
  );
  const [selectedNumber, setSelectedNumber] = useState<AvailableNumber | null>(
    null,
  );

  // Check Twilio connection on open
  useEffect(() => {
    if (open && workspaceId) {
      supabase
        .from("workspace_integrations")
        .select("is_connected")
        .eq("workspace_id", workspaceId)
        .eq("provider", "twilio")
        .maybeSingle()
        .then(({ data }) => {
          const connected = data?.is_connected === true;
          setTwilioConnected(connected);
          // If Twilio connected, go straight to search. Otherwise show VAPI mode.
          setMode(connected ? "twilio-search" : "vapi");
        });
    }
  }, [open, workspaceId]);

  const resetState = () => {
    setFriendlyName("");
    setAreaCode("");
    setInboundAgentId(null);
    setOutboundAgentId(null);
    setCountry("US");
    setSearchAreaCode("");
    setAvailableNumbers([]);
    setSelectedNumber(null);
    setMode("select");
  };

  const handleSearch = async () => {
    setSearching(true);
    try {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke(
        "search-available-numbers",
        {
          body: {
            workspaceId,
            country,
            areaCode: searchAreaCode || undefined,
            limit: 15,
          },
          headers: { Authorization: `Bearer ${authData.session.access_token}` },
        },
      );

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      setAvailableNumbers(response.data?.numbers || []);
      if ((response.data?.numbers || []).length === 0) {
        toast({
          title: "No numbers found",
          description: "Try a different area code or country",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handleSelectNumber = (num: AvailableNumber) => {
    setSelectedNumber(num);
    setFriendlyName(num.friendlyName || "");
    setMode("twilio-configure");
  };

  const handlePurchase = async (purchaseMode: "vapi" | "twilio") => {
    setPurchasing(true);
    try {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) throw new Error("Not authenticated");

      const body: Record<string, unknown> = {
        workspaceId,
        mode: purchaseMode,
        friendlyName: friendlyName || undefined,
        inboundAgentId,
        outboundAgentId,
      };

      if (purchaseMode === "twilio" && selectedNumber) {
        body.phoneNumber = selectedNumber.phoneNumber;
        body.country = country;
      } else {
        body.areaCode = areaCode || undefined;
      }

      const response = await supabase.functions.invoke(
        "purchase-phone-number",
        {
          body,
          headers: { Authorization: `Bearer ${authData.session.access_token}` },
        },
      );

      if (response.error) {
        const serverMessage = response.data?.error || response.data?.message;
        throw new Error(
          serverMessage ||
            response.error.message ||
            "Failed to add phone number",
        );
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "Success",
        description: "Phone number has been added to your workspace",
      });
      resetState();
      onSuccess();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to purchase phone number";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setPurchasing(false);
    }
  };

  const formatPhoneDisplay = (num: string) => {
    if (num.startsWith("+1") && num.length === 12) {
      return `(${num.slice(2, 5)}) ${num.slice(5, 8)}-${num.slice(8)}`;
    }
    return num;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetState();
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Phone Number</DialogTitle>
          <DialogDescription>
            {mode === "twilio-search" && "Search and purchase a phone number"}
            {mode === "twilio-configure" && "Configure your new number"}
            {mode === "vapi" && "Get a free virtual phone number"}
            {mode === "select" && "Choose how to add a phone number"}
          </DialogDescription>
        </DialogHeader>

        {/* MODE: Twilio Search */}
        {mode === "twilio-search" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="country">Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="searchAreaCode">Area Code</Label>
                <Input
                  id="searchAreaCode"
                  placeholder="e.g., 613, 416"
                  value={searchAreaCode}
                  onChange={(e) =>
                    setSearchAreaCode(
                      e.target.value.replace(/\D/g, "").slice(0, 3),
                    )
                  }
                  maxLength={3}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {availableNumbers.length > 0 && (
              <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                {availableNumbers.map((num) => (
                  <div
                    key={num.phoneNumber}
                    className="flex items-center justify-between p-3 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleSelectNumber(num)}
                  >
                    <div>
                      <div className="font-medium font-mono">
                        {formatPhoneDisplay(num.phoneNumber)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {[num.locality, num.region].filter(Boolean).join(", ")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {num.capabilities.sms && (
                        <Badge variant="secondary" className="text-xs">
                          SMS
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        Voice
                      </Badge>
                      <Button size="sm" variant="outline">
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode("vapi")}
                className="text-muted-foreground"
              >
                Or get a free virtual number instead
              </Button>
            </div>
          </div>
        )}

        {/* MODE: Twilio Configure (after selecting a number) */}
        {mode === "twilio-configure" && selectedNumber && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
              <Phone className="h-5 w-5" />
              <div>
                <div className="font-medium font-mono">
                  {formatPhoneDisplay(selectedNumber.phoneNumber)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {[selectedNumber.locality, selectedNumber.region]
                    .filter(Boolean)
                    .join(", ")}{" "}
                  ~$1.15/mo
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="friendlyName">Friendly Name (Optional)</Label>
              <Input
                id="friendlyName"
                placeholder="e.g., Main Support Line"
                value={friendlyName}
                onChange={(e) => setFriendlyName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Inbound Agent (Optional)</Label>
              <PhoneNumberAgentSelector
                workspaceId={workspaceId}
                selectedAgentId={inboundAgentId}
                onAgentChange={setInboundAgentId}
                placeholder="Select agent for incoming calls"
              />
            </div>

            <div className="space-y-2">
              <Label>Outbound Agent (Optional)</Label>
              <PhoneNumberAgentSelector
                workspaceId={workspaceId}
                selectedAgentId={outboundAgentId}
                onAgentChange={setOutboundAgentId}
                placeholder="Select agent for outgoing calls"
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedNumber(null);
                  setMode("twilio-search");
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => handlePurchase("twilio")}
                disabled={purchasing}
              >
                {purchasing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Purchasing...
                  </>
                ) : (
                  <>
                    Purchase Number
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* MODE: VAPI Free Number */}
        {mode === "vapi" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
              <Phone className="h-5 w-5" />
              <div className="text-sm">
                A free virtual number will be provisioned (outbound only, US
                area codes).
              </div>
            </div>

            {twilioConnected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode("twilio-search")}
                className="text-muted-foreground w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to number search
              </Button>
            )}

            {!twilioConnected && (
              <div className="p-3 border rounded-lg text-sm text-muted-foreground">
                <div className="flex items-center gap-2 mb-1">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium text-foreground">
                    Want real phone numbers?
                  </span>
                </div>
                Connect your Twilio account in Settings to purchase real numbers
                with custom area codes (US, Canada, UK).
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="friendlyName">Friendly Name (Optional)</Label>
              <Input
                id="friendlyName"
                placeholder="e.g., Main Support Line"
                value={friendlyName}
                onChange={(e) => setFriendlyName(e.target.value)}
                maxLength={40}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="areaCode">Preferred Area Code (Optional)</Label>
              <Input
                id="areaCode"
                placeholder="e.g., 415, 212 (US only)"
                value={areaCode}
                onChange={(e) =>
                  setAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))
                }
                maxLength={3}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => handlePurchase("vapi")}
                disabled={purchasing}
              >
                {purchasing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Provisioning...
                  </>
                ) : (
                  <>
                    Add Free Number
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
