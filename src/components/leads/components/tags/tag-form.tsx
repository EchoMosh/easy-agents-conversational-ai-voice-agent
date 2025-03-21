
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface TagFormData {
  name: string;
}

interface TagFormProps {
  defaultValues?: TagFormData;
  onSubmit: (data: TagFormData) => void;
  isSubmitting?: boolean;
  maxLength?: number;
}

export function TagForm({ 
  defaultValues, 
  onSubmit, 
  isSubmitting = false,
  maxLength = 25
}: TagFormProps) {
  const { register, handleSubmit, watch } = useForm<TagFormData>({
    defaultValues: defaultValues || { name: "" }
  });
  
  const currentName = watch("name") || "";
  const nameLength = currentName.length;
  const isNameTooLong = nameLength > maxLength;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...register("name", { required: true, maxLength })}
          placeholder="Enter tag name"
          className={`h-10 ${isNameTooLong ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          disabled={isSubmitting}
        />
        <div className="flex justify-between text-xs">
          <div className={`${isNameTooLong ? 'text-red-500' : 'text-gray-500'}`}>
            {nameLength}/{maxLength}
          </div>
          {isNameTooLong && (
            <div className="text-red-500">
              Tag name is too long
            </div>
          )}
        </div>
      </div>
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isSubmitting || isNameTooLong || nameLength === 0}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Tag'
        )}
      </Button>
    </form>
  );
}
