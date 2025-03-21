
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
    { value: "name", label: "Name", required: true },
    { value: "email", label: "Email", required: true },
    { value: "phone", label: "Phone", required: false },
    { value: "status", label: "Status", required: false },
    { value: "source", label: "Source", required: false },
    { value: null, label: "Ignore", required: false },
  ];

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-700 truncate max-w-[120px]" title={csvHeader}>
        {csvHeader}
      </p>
      <Select
        value={selectedField === null ? "ignore" : selectedField}
        onValueChange={(value) => onChange(value === "ignore" ? null : value)}
      >
        <SelectTrigger className="w-[120px] h-8 text-xs">
          <SelectValue placeholder="Map to..." />
        </SelectTrigger>
        <SelectContent position="popper" className="w-[120px] z-[9999]">
          {fieldOptions.map((option) => (
            <SelectItem
              key={option.value || "ignore"}
              value={option.value || "ignore"}
              className="text-xs"
            >
              {option.label}
              {option.required && (
                <Badge variant="outline" className="ml-1 py-0 text-[10px] font-normal">
                  req
                </Badge>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
