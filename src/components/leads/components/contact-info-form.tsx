
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";

interface ContactInfoFormProps {
  phone: string;
  onPhoneChange: (value: string) => void;
  firstName?: string;
  onFirstNameChange?: (value: string) => void;
  lastName?: string;
  onLastNameChange?: (value: string) => void;
  email?: string;
  onEmailChange?: (value: string) => void;
  required?: boolean;
}

export function ContactInfoForm({ 
  phone, 
  onPhoneChange, 
  firstName = "", 
  onFirstNameChange, 
  lastName = "", 
  onLastNameChange, 
  email = "", 
  onEmailChange, 
  required = false 
}: ContactInfoFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
            First name <span className="text-red-500">*</span>
          </Label>
          <Input id="firstName" name="firstName" value={firstName} onChange={(e) => onFirstNameChange && onFirstNameChange(e.target.value)} required className="h-11 text-base border border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-1 transition-colors" placeholder="John" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last name</Label>
          <Input id="lastName" name="lastName" value={lastName} onChange={(e) => onLastNameChange && onLastNameChange(e.target.value)} className="h-11 text-base border border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-1 transition-colors" placeholder="Doe" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
          <Input id="email" name="email" type="email" value={email} onChange={(e) => onEmailChange && onEmailChange(e.target.value)} className="h-11 text-base border border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-1 transition-colors" placeholder="john@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Phone <span className="text-red-500">*</span>
          </Label>
          <PhoneInput 
            id="phone" 
            name="phone" 
            value={phone} 
            onChange={onPhoneChange} 
            required
            className="[&>div]:!h-11 [&>div]:!text-base [&>div]:!border-gray-300 [&>div]:!bg-white [&>div]:hover:!bg-gray-50 [&>div]:!transition-colors [&>div>div]:!border-gray-300 [&>div>div]:!bg-white [&>div>div]:hover:!bg-gray-50" 
          />
        </div>
      </div>
    </div>
  );
}
