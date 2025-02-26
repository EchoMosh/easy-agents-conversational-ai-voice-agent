
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
}

export function TagForm({ defaultValues, onSubmit, isSubmitting = false }: TagFormProps) {
  const { register, handleSubmit } = useForm<TagFormData>({
    defaultValues: defaultValues || { name: "" }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...register("name", { required: true })}
          placeholder="Enter tag name"
          className="h-10"
          disabled={isSubmitting}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
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
