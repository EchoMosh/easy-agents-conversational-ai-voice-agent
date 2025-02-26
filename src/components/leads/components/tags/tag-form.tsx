
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { TagColor } from "@/types/tag-types";
import { Circle } from "lucide-react";

interface TagFormData {
  name: string;
  color: TagColor;
}

interface TagFormProps {
  defaultValues?: TagFormData;
  onSubmit: (data: TagFormData) => void;
}

const colorOptions: { value: TagColor; label: string }[] = [
  { value: "gray", label: "Gray" },
  { value: "red", label: "Red" },
  { value: "yellow", label: "Yellow" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
  { value: "purple", label: "Purple" },
  { value: "pink", label: "Pink" },
];

export function TagForm({ defaultValues, onSubmit }: TagFormProps) {
  const { register, handleSubmit, setValue, watch } = useForm<TagFormData>({
    defaultValues: defaultValues || { name: "", color: "gray" }
  });

  const selectedColor = watch("color");

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
      <div className="space-y-2">
        <Label>Color</Label>
        <Select
          value={selectedColor}
          onValueChange={(value: TagColor) => setValue("color", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {colorOptions.map((color) => (
              <SelectItem key={color.value} value={color.value}>
                <div className="flex items-center">
                  <Circle className={`w-4 h-4 mr-2 text-${color.value}-500`} fill="currentColor" />
                  {color.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full">Save Tag</Button>
    </form>
  );
}
