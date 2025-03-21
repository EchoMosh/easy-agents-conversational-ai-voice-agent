
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ColumnMapSelectorProps {
  csvHeader: string;
  selectedField: string | null;
  onChange: (value: string | null) => void;
}

export const ColumnMapSelector: React.FC<ColumnMapSelectorProps> = ({
  csvHeader,
  selectedField,
  onChange,
}) => {
  const fieldOptions = [
    { value: "name", label: "Name" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "status", label: "Status" },
    { value: "source", label: "Source" },
    { value: null, label: "Ignore" },
  ];

  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500 truncate max-w-[120px]" title={csvHeader}>
        {csvHeader}
      </p>
      <Select
        value={selectedField === null ? "ignore" : selectedField}
        onValueChange={(value) => onChange(value === "ignore" ? null : value)}
      >
        <SelectTrigger className="w-[120px] h-8 text-xs">
          <SelectValue placeholder="Map to..." />
        </SelectTrigger>
        <SelectContent>
          {fieldOptions.map((option) => (
            <SelectItem
              key={option.value || "ignore"}
              value={option.value || "ignore"}
              className="text-xs"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
