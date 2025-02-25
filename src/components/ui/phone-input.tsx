
import { forwardRef } from 'react';
import ReactPhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { cn } from "@/lib/utils";

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, onChange, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <ReactPhoneInput
          country={'us'}
          enableSearch
          inputClass={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus:border-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white",
            className
          )}
          buttonClass="!border-input !bg-background hover:!bg-accent dark:!text-white"
          dropdownClass="!bg-background !border-input dark:!bg-gray-800 dark:!text-white"
          searchClass="!bg-background !border-input dark:!bg-gray-800 dark:!text-white"
          containerClass="!block !w-full"
          inputStyle={{ width: '100%' }}
          onChange={(value) => onChange(value)}
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
