
import { Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { TimelineItem } from "../types/timeline-types";
import { cn } from "@/lib/utils";

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
  const activityTypes: { type: TimelineItem['type']; label: string; }[] = [
    { type: 'note', label: 'Notes' },
    { type: 'status_change', label: 'Status Changes' },
    { type: 'contact_update', label: 'Contact Updates' },
    { type: 'name_update', label: 'Name Updates' },
    { type: 'variable_add', label: 'Variable Changes' },
    { type: 'lead_created', label: 'Lead Created' },
  ];

  const activeFiltersCount = activityTypes.length - selectedTypes.size;

  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-3 px-4 border-b">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search activities..."
            className={cn(
              "w-full pl-9 pr-8 py-2 text-sm bg-muted/50 hover:bg-muted/80 rounded-md border-0 focus-visible:ring-1 focus-visible:ring-purple-500 transition-colors",
              searchQuery && "pr-8"
            )}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => onSearchChange("")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "h-9 bg-background hover:bg-muted gap-1.5",
                activeFiltersCount > 0 && "text-purple-600 border-purple-200 dark:border-purple-900"
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              Filter
              {activeFiltersCount > 0 && (
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-purple-100 text-purple-600 text-xs font-medium dark:bg-purple-900/50 dark:text-purple-300">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {activityTypes.map((activity) => (
              <DropdownMenuCheckboxItem
                key={activity.type}
                checked={selectedTypes.has(activity.type)}
                onCheckedChange={() => onToggleType(activity.type)}
                className="capitalize"
              >
                {activity.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
