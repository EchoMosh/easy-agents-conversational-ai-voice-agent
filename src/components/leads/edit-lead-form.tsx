
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name*</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <PhoneInput
            id="phone"
            value={phone}
            onChange={(value) => setPhone(value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(value: Lead['status']) => setStatus(value)}>
            <SelectTrigger>
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

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Updating..." : "Update Lead"}
      </Button>
    </form>
  );
}
