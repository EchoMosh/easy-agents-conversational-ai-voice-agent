
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";

interface ContactInfoFormProps {
  phone: string;
  onPhoneChange: (value: string) => void;
}

export function ContactInfoForm({ phone, onPhoneChange }: ContactInfoFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium text-muted-foreground">First name</Label>
          <Input id="firstName" name="firstName" required className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors" placeholder="John" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium text-muted-foreground">Last name</Label>
          <Input id="lastName" name="lastName" required className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors" placeholder="Doe" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email</Label>
          <Input id="email" name="email" type="email" className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors" placeholder="john@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium text-muted-foreground">Phone</Label>
          <PhoneInput id="phone" name="phone" value={phone} onChange={onPhoneChange} className="[&>div]:!h-11 [&>div]:!text-base [&>div]:!border-border/50 [&>div]:!bg-background/50 [&>div]:hover:!bg-background/80 [&>div]:!transition-colors [&>div>div]:!border-border/50 [&>div>div]:!bg-background/50 [&>div>div]:hover:!bg-background/80" />
        </div>
      </div>
    </div>
  );
}
