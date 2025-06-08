import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Phone, ArrowRight, ArrowLeft } from "lucide-react";
import { formatPhoneNumber } from "@/utils/phone-number-utils";
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
  capabilities: {
    voice: boolean;
    SMS: boolean;
    MMS: boolean;
  };
  monthlyPrice: number;
  areaCode: string;
}

export const AddPhoneNumberDialog = ({
  open,
  onOpenChange,
  workspaceId,
  onSuccess,
}: AddPhoneNumberDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<"search" | "configure">("search");
  const [searching, setSearching] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  
  // Search state
  const [areaCode, setAreaCode] = useState("");
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<AvailableNumber | null>(null);
  
  // Configuration state
  const [friendlyName, setFriendlyName] = useState("");
  const [inboundAgentId, setInboundAgentId] = useState<string | null>(null);
  const [outboundAgentId, setOutboundAgentId] = useState<string | null>(null);

  const resetState = () => {
    setStep("search");
    setAreaCode("");
    setAvailableNumbers([]);
    setSelectedNumber(null);
    setFriendlyName("");
    setInboundAgentId(null);
    setOutboundAgentId(null);
  };

  const handleSearch = async () => {
    setSearching(true);
    try {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("search-available-numbers", {
        body: { areaCode, country: "US", limit: 10 },
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
        },
      });

      if (response.error) throw response.error;

      setAvailableNumbers(response.data.numbers || []);
      
      if (response.data.numbers?.length === 0) {
        toast({
          title: "No numbers found",
          description: areaCode 
            ? `No available numbers found in area code ${areaCode}`
            : "No available numbers found. Try a different search.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error searching numbers:", error);
      toast({
        title: "Error",
        description: "Failed to search for available numbers",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSelectNumber = (number: AvailableNumber) => {
    setSelectedNumber(number);
    setFriendlyName(number.friendlyName);
    setStep("configure");
  };

  const handlePurchase = async () => {
    if (!selectedNumber) return;

    setPurchasing(true);
    try {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("purchase-phone-number", {
        body: {
          phoneNumber: selectedNumber.phoneNumber,
          workspaceId,
          friendlyName: friendlyName || selectedNumber.friendlyName,
          inboundAgentId,
          outboundAgentId,
        },
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Success",
        description: `Phone number ${formatPhoneNumber(selectedNumber.phoneNumber)} has been added to your workspace`,
      });

      resetState();
      onSuccess();
    } catch (error) {
      console.error("Error purchasing number:", error);
      toast({
        title: "Error",
        description: "Failed to purchase phone number. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen) resetState();
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        {step === "search" ? (
          <>
            <DialogHeader>
              <DialogTitle>Add Phone Number</DialogTitle>
              <DialogDescription>
                Search for available phone numbers in your preferred area
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="areaCode">Area Code (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="areaCode"
                    placeholder="e.g., 415, 212"
                    value={areaCode}
                    onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button 
                    onClick={handleSearch}
                    disabled={searching}
                  >
                    {searching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Search
                  </Button>
                </div>
              </div>

              {availableNumbers.length > 0 && (
                <div className="space-y-2">
                  <Label>Available Numbers</Label>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-2">
                    {availableNumbers.map((number) => (
                      <div
                        key={number.phoneNumber}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handleSelectNumber(number)}
                      >
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {formatPhoneNumber(number.phoneNumber)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {number.friendlyName}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">
                            ${number.monthlyPrice}/mo
                          </span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Configure Phone Number</DialogTitle>
              <DialogDescription>
                Set up your new phone number and assign agents
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                <Phone className="h-5 w-5" />
                <div>
                  <div className="font-medium">
                    {selectedNumber && formatPhoneNumber(selectedNumber.phoneNumber)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${selectedNumber?.monthlyPrice}/month
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="friendlyName">Friendly Name</Label>
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
                <p className="text-sm text-muted-foreground">
                  This agent will handle all incoming calls to this number
                </p>
              </div>

              <div className="space-y-2">
                <Label>Outbound Agent (Optional)</Label>
                <PhoneNumberAgentSelector
                  workspaceId={workspaceId}
                  selectedAgentId={outboundAgentId}
                  onAgentChange={setOutboundAgentId}
                  placeholder="Select agent for outgoing calls"
                />
                <p className="text-sm text-muted-foreground">
                  This agent will be used when making calls from this number
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("search")}
                  disabled={purchasing}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handlePurchase}
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Purchasing...
                    </>
                  ) : (
                    <>
                      Add Phone Number
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
