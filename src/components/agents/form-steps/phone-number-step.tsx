import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Plus, ArrowRight, SkipForward } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber } from "@/utils/phone-number-utils";
import { AddPhoneNumberDialog } from "@/components/phone-numbers/add-phone-number-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PhoneNumberStepProps {
  workspaceId: string;
  selectedPhoneNumberId: string | null;
  onPhoneNumberSelect: (phoneNumberId: string | null) => void;
  onNext: () => void;
  onBack: () => void;
}

interface PhoneNumber {
  id: string;
  twilio_phone_number: string;
  friendly_name: string | null;
  status: string;
}

export function PhoneNumberStep({
  workspaceId,
  selectedPhoneNumberId,
  onPhoneNumberSelect,
  onNext,
  onBack,
}: PhoneNumberStepProps) {
  const { toast } = useToast();
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchPhoneNumbers();
  }, [workspaceId]);

  const fetchPhoneNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from("phone_numbers")
        .select("id, twilio_phone_number, friendly_name, status")
        .eq("workspace_id", workspaceId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPhoneNumbers(data || []);
    } catch (error) {
      console.error("Error fetching phone numbers:", error);
      toast({
        title: "Error",
        description: "Failed to load phone numbers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneNumberAdded = () => {
    setShowAddDialog(false);
    fetchPhoneNumbers(); // Refresh the list
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Assign a Phone Number (Optional)</CardTitle>
          <CardDescription>
            You can assign a phone number now or do this later
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Option 1: Select existing number */}
          {phoneNumbers.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Select existing number</label>
              <Select
                value={selectedPhoneNumberId || "none"}
                onValueChange={(value) => 
                  onPhoneNumberSelect(value === "none" ? null : value)
                }
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a phone number">
                    {selectedPhoneNumberId === null || selectedPhoneNumberId === "none" ? (
                      <span className="text-muted-foreground">No number selected</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>
                          {phoneNumbers.find(p => p.id === selectedPhoneNumberId)?.friendly_name || 
                           formatPhoneNumber(phoneNumbers.find(p => p.id === selectedPhoneNumberId)?.twilio_phone_number || "")}
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No number assigned</span>
                  </SelectItem>
                  {phoneNumbers.map((phoneNumber) => (
                    <SelectItem key={phoneNumber.id} value={phoneNumber.id}>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <div>
                          <div className="font-medium">
                            {phoneNumber.friendly_name || formatPhoneNumber(phoneNumber.twilio_phone_number)}
                          </div>
                          {phoneNumber.friendly_name && (
                            <div className="text-xs text-muted-foreground">
                              {formatPhoneNumber(phoneNumber.twilio_phone_number)}
                            </div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Option 2: Get new number */}
          <div className={phoneNumbers.length > 0 ? "relative" : ""}>
            {phoneNumbers.length > 0 && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center px-3">
                <div className="flex-1 border-t" />
                <span className="px-3 text-sm text-muted-foreground">or</span>
                <div className="flex-1 border-t" />
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              className={phoneNumbers.length > 0 ? "mt-12 w-full" : "w-full"}
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Get New Number
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onNext}>
          {selectedPhoneNumberId ? "Finish" : "Skip & Finish"}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <AddPhoneNumberDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        workspaceId={workspaceId}
        onSuccess={handlePhoneNumberAdded}
      />
    </>
  );
}
