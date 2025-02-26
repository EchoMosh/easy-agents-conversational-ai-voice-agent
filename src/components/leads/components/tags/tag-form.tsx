
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface TagFormData {
  name: string;
}

interface TagFormProps {
  defaultValues?: TagFormData;
  onSubmit: (data: TagFormData) => void;
}

export function TagForm({ defaultValues, onSubmit }: TagFormProps) {
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
        />
      </div>
      <Button type="submit" className="w-full">Save Tag</Button>
    </form>
  );
}
