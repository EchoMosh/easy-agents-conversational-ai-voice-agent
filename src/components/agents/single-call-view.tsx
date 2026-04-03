import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Phone,
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  X,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { isValidE164, formatPhoneNumber } from "@/utils/phone-number-utils";
import { Agent } from "@/types/agent";

export interface WorkspacePhone {
  id: string;
  twilio_phone_number: string | null;
  friendly_name: string | null;
  vapi_phone_number_id: string | null;
  monthly_cost?: number;
}

interface ContactResult {
  id: string;
  name: string | null;
  phone: string;
  email?: string | null;
}

interface SingleCallViewProps {
  agent: Agent;
  phoneNumbers: WorkspacePhone[];
  workspaceId: string;
  onBack: () => void;
}

type CallState = "idle" | "calling" | "success" | "error";

export function SingleCallView({
  agent,
  phoneNumbers,
  workspaceId,
  onBack,
}: SingleCallViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ContactResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactResult | null>(
    null,
  );
  const searchRef = useRef<HTMLDivElement>(null);

  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  // Only real (Twilio) phone numbers can make outbound calls — VAPI virtual numbers cannot
  const validPhones = phoneNumbers.filter(
    (p) => p.vapi_phone_number_id && p.twilio_phone_number,
  );
  const hasOnlyVirtualNumbers =
    validPhones.length === 0 &&
    phoneNumbers.some((p) => p.vapi_phone_number_id && !p.twilio_phone_number);
  const [selectedPhoneId, setSelectedPhoneId] = useState(
    validPhones.length === 1 ? (validPhones[0].vapi_phone_number_id ?? "") : "",
  );
  const [callState, setCallState] = useState<CallState>("idle");
  const [callId, setCallId] = useState("");
  const [callError, setCallError] = useState("");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced contact search
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await supabase
          .from("leads")
          .select("id, name, phone, email")
          .eq("workspace_id", workspaceId)
          .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
          .not("phone", "is", null)
          .limit(8);

        setSearchResults(data || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("Contact search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, workspaceId]);

  const normalizePhone = (phone: string): string => {
    const stripped = phone.replace(/[^\d+]/g, "");
    if (!stripped.startsWith("+")) return `+${stripped}`;
    return stripped;
  };

  const selectContact = (contact: ContactResult) => {
    setSelectedContact(contact);
    setCustomerPhone(normalizePhone(contact.phone));
    setCustomerName(contact.name || "");
    setSearchQuery("");
    setShowDropdown(false);
  };

  const clearContact = () => {
    setSelectedContact(null);
    setCustomerPhone("");
    setCustomerName("");
  };

  const phoneInputValid = isValidE164(customerPhone);
  const canCall = phoneInputValid && selectedPhoneId && callState === "idle";

  const handleCall = async () => {
    if (!canCall) return;
    setCallState("calling");
    setCallError("");
    try {
      const { data, error } = await supabase.functions.invoke(
        "initiate-vapi-call",
        {
          body: {
            v_agent_id: agent.v_agent_id,
            vapi_phone_number_id: selectedPhoneId,
            customer_number: customerPhone,
            customer_name: customerName.trim() || undefined,
          },
        },
      );

      if (error || !data?.success) {
        const msg =
          error?.message ||
          data?.error ||
          data?.details?.message ||
          "Failed to initiate call";
        setCallError(msg);
        setCallState("error");
        return;
      }

      setCallId(data.call_id);

      // Poll call status to verify it actually connected
      const vapiKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
      if (data.call_id && vapiKey) {
        let verified = false;
        for (let i = 0; i < 6; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          try {
            const statusRes = await fetch(
              `https://api.vapi.ai/call/${data.call_id}`,
              { headers: { Authorization: `Bearer ${vapiKey}` } },
            );
            if (statusRes.ok) {
              const callData = await statusRes.json();
              if (callData.status === "ended" && callData.endedReason) {
                const reason = callData.endedReason;
                if (reason.includes("error") || reason.includes("failed")) {
                  setCallError(`Call failed: ${reason.replace(/-/g, " ")}`);
                  setCallState("error");
                  return;
                }
              }
              if (
                callData.status === "in-progress" ||
                callData.status === "ringing"
              ) {
                verified = true;
                break;
              }
            }
          } catch (pollErr) {
            console.error("Error polling call status:", pollErr);
          }
        }
        // If we polled 6 times and never saw in-progress, show as pending
        if (!verified) {
          setCallState("success"); // Show success but it might still be queued
        } else {
          setCallState("success");
        }
      } else {
        setCallState("success");
      }
    } catch (err) {
      setCallError(err instanceof Error ? err.message : "Unknown error");
      setCallState("error");
    }
  };

  if (callState === "success") {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-4">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <p className="text-lg font-semibold text-foreground">Call Initiated</p>
        <p className="text-sm text-muted-foreground">
          Calling{" "}
          <span className="font-medium text-foreground">
            {customerName || customerPhone}
          </span>
          {customerName && (
            <span className="ml-1 text-muted-foreground">
              ({customerPhone})
            </span>
          )}
        </p>
        {callId && (
          <p className="text-xs text-muted-foreground font-mono">
            ID: {callId}
          </p>
        )}
        <Button variant="outline" onClick={onBack} className="mt-2">
          Done
        </Button>
      </div>
    );
  }

  if (callState === "error") {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <p className="text-lg font-semibold text-red-600 dark:text-red-400">
          Call Failed
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">{callError}</p>
        <div className="flex gap-2 mt-2">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={() => setCallState("idle")}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Contact search */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Search Contacts</Label>

        {selectedContact ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
            <UserRound className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {selectedContact.name || selectedContact.phone}
              </p>
              {selectedContact.name && (
                <p className="text-xs text-muted-foreground">
                  {selectedContact.phone}
                </p>
              )}
            </div>
            <button
              onClick={clearContact}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div ref={searchRef} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
                className="h-10 pl-9"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {showDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                {searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-3 py-2.5">
                    No contacts found
                  </p>
                ) : (
                  <ul>
                    {searchResults.map((contact) => (
                      <li key={contact.id}>
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent text-left transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectContact(contact);
                          }}
                        >
                          <UserRound className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {contact.name || contact.phone}
                            </p>
                            {contact.name && (
                              <p className="text-xs text-muted-foreground">
                                {contact.phone}
                              </p>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {!selectedContact && (
          <p className="text-xs text-muted-foreground">
            Or enter a number manually below
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Phone number */}
      <div className="space-y-1.5">
        <Label htmlFor="customer-phone" className="text-sm font-medium">
          Phone Number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="customer-phone"
          type="tel"
          placeholder="+15551234567"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value.trim())}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && !v.startsWith("+")) setCustomerPhone(`+${v}`);
          }}
          className="h-10"
        />
        {customerPhone && !phoneInputValid && (
          <p className="text-xs text-destructive">
            Must be E.164 format, e.g. +15551234567
          </p>
        )}
      </div>

      {/* Contact name */}
      <div className="space-y-1.5">
        <Label htmlFor="customer-name" className="text-sm font-medium">
          Contact Name{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="customer-name"
          placeholder="Jane Smith"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="h-10"
        />
      </div>

      {/* FROM phone number */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          Call From <span className="text-destructive">*</span>
        </Label>
        {validPhones.length === 0 ? (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {hasOnlyVirtualNumbers
              ? "Virtual numbers cannot make outbound calls. Connect Twilio in Settings to purchase a real number."
              : "No phone numbers configured for outbound calls. Add one in Phone Numbers settings."}
          </p>
        ) : (
          <Select value={selectedPhoneId} onValueChange={setSelectedPhoneId}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select a phone number..." />
            </SelectTrigger>
            <SelectContent>
              {validPhones.map((p) => (
                <SelectItem key={p.id} value={p.vapi_phone_number_id!}>
                  {p.friendly_name || formatPhoneNumber(p.twilio_phone_number)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={callState === "calling"}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleCall} disabled={!canCall} className="flex-1">
          {callState === "calling" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Phone className="h-4 w-4 mr-2" />
          )}
          {callState === "calling" ? "Calling..." : "Call Now"}
        </Button>
      </div>
    </div>
  );
}
