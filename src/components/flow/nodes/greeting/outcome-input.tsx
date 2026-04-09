import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface OutcomeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isEditing: boolean;
}

export function OutcomeInput({
  value,
  onChange,
  onSave,
  onCancel,
  isEditing,
}: OutcomeInputProps) {
  return (
    <div className="flex gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter possible response..."
        className="nodrag text-sm resize-none min-h-[80px] bg-white/10 border-white/20"
      />
      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          className="px-4 bg-white/20 hover:bg-white/30 text-white shadow-lg"
          onClick={onSave}
        >
          {isEditing ? "Save" : "Add"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="px-4 text-white/70 hover:text-white hover:bg-white/10"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
