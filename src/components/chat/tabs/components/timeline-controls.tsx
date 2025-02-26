
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimelineItem } from "../types/timeline-types";

interface TimelineControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedTypes: Set<TimelineItem['type']>;
  onToggleType: (type: TimelineItem['type']) => void;
}

export function TimelineControls({
  searchQuery,
  onSearchChange,
  selectedTypes,
  onToggleType,
}: TimelineControlsProps) {
  const getActivityLabel = (type: TimelineItem['type']) => {
    switch (type) {
      case 'note':
        return 'Notes';
      case 'status_change':
        return 'Status Changes';
      case 'contact_update':
        return 'Contact Updates';
      case 'name_update':
        return 'Name Updates';
      case 'variable_add':
        return 'Variable Changes';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search activities..."
          className="w-full px-3 py-1 text-sm border rounded-md"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {(['note', 'status_change', 'contact_update', 'name_update', 'variable_add'] as const).map((type) => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={selectedTypes.has(type)}
              onCheckedChange={() => onToggleType(type)}
            >
              {getActivityLabel(type)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
