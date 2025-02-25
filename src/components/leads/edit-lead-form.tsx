
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PhoneInput } from "@/components/ui/phone-input";
import { Lead } from "@/pages/dashboard/leads";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditLeadFormProps {
  lead: Lead;
  onSuccess: () => void;
}

export function EditLeadForm({ lead, onSuccess }: EditLeadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(lead.name);
  const [email, setEmail] = useState(lead.email || "");
  const [phone, setPhone] = useState(lead.phone || "");
  const [status, setStatus] = useState(lead.status);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          name,
          email: email || null,
          phone: phone || null,
          status,
        })
        .eq("id", lead.id);

      if (updateError) throw updateError;

      toast.success("Lead updated successfully");
      onSuccess();
    } catch (error) {
      toast.error("Failed to update lead");
      console.error("Error updating lead:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [firstName, lastName] = name.split(" ");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-base font-normal text-muted-foreground">First name</Label>
            <Input 
              id="firstName" 
              value={firstName}
              onChange={(e) => setName(`${e.target.value} ${lastName}`)}
              required 
              className="h-12 text-lg border-0 bg-muted/40 focus-visible:ring-1 transition-all duration-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-base font-normal text-muted-foreground">Last name</Label>
            <Input 
              id="lastName" 
              value={lastName}
              onChange={(e) => setName(`${firstName} ${e.target.value}`)}
              required 
              className="h-12 text-lg border-0 bg-muted/40 focus-visible:ring-1 transition-all duration-200"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-base font-normal text-muted-foreground">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 text-lg border-0 bg-muted/40 focus-visible:ring-1 transition-all duration-200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-base font-normal text-muted-foreground">Phone</Label>
          <PhoneInput
            id="phone"
            value={phone}
            onChange={(value) => setPhone(value)}
            className="h-12 text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status" className="text-base font-normal text-muted-foreground">Status</Label>
          <Select value={status} onValueChange={(value: Lead['status']) => setStatus(value)}>
            <SelectTrigger className="h-12 text-lg border-0 bg-muted/40 focus-visible:ring-1 transition-all duration-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full h-12 text-lg rounded-full transition-all duration-200 hover:scale-[0.98]" 
        disabled={isLoading}
      >
        {isLoading ? "Updating..." : "Update Lead"}
      </Button>
    </form>
  );
}
