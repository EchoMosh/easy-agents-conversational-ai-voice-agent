
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";

interface ContactInfoFormProps {
  phone: string;
  onPhoneChange: (value: string) => void;
  required?: boolean;
}

export function ContactInfoForm({ phone, onPhoneChange, required = false }: ContactInfoFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First name</Label>
          <Input id="firstName" name="firstName" required className="h-11 text-base border border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-1 transition-colors" placeholder="John" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last name</Label>
          <Input id="lastName" name="lastName" required className="h-11 text-base border border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-1 transition-colors" placeholder="Doe" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
          <Input id="email" name="email" type="email" className="h-11 text-base border border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-1 transition-colors" placeholder="john@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Phone {required && <span className="text-red-500">*</span>}
          </Label>
          <PhoneInput 
            id="phone" 
            name="phone" 
            value={phone} 
            onChange={onPhoneChange} 
            required={required}
            className="[&>div]:!h-11 [&>div]:!text-base [&>div]:!border-gray-300 [&>div]:!bg-white [&>div]:hover:!bg-gray-50 [&>div]:!transition-colors [&>div>div]:!border-gray-300 [&>div>div]:!bg-white [&>div>div]:hover:!bg-gray-50" 
          />
        </div>
      </div>
    </div>
  );
}
