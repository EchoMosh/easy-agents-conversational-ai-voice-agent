import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { ReactNode, useState } from "react";
import { Tag } from "@/types/tag-types";
import { TagFilter } from "./tag-filter";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SearchAndFiltersProps {
  selectedPipelineId: string | undefined;
  setSelectedPipelineId: (id: string | undefined) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  pipelines: Array<{ id: string; name: string }>;
  availableTags: Tag[];
  selectedTagIds: string[];
  setSelectedTagIds: (tagIds: string[]) => void;
  addLeadDialog?: ReactNode;
}

export function SearchAndFilters({
  selectedPipelineId,
  setSelectedPipelineId,
  searchQuery,
  setSearchQuery,
  pipelines,
  availableTags,
  selectedTagIds,
  setSelectedTagIds,
  addLeadDialog,
}: SearchAndFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const hasActiveFilters = selectedPipelineId || selectedTagIds.length > 0;

  return (
    <div className="pt-4 pb-2 px-4 border-b">
      {/* Main search bar and add button - always visible */}
      <div className="flex flex-wrap gap-4 items-center w-full">
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="searchLeads"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className={`h-10 ${hasActiveFilters ? "bg-muted" : ""}`}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {(selectedPipelineId ? 1 : 0) +
                (selectedTagIds.length > 0 ? 1 : 0)}
            </span>
          )}
        </Button>

        <div className="ml-auto">{addLeadDialog}</div>
      </div>

      {/* Collapsible filters section */}
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <CollapsibleContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg border">
            <div>
              <Label
                htmlFor="pipelineFilter"
                className="text-sm font-medium mb-1.5 block"
              >
                Filter by Pipeline
              </Label>
              <Select
                value={selectedPipelineId || "all"}
                onValueChange={(value) =>
                  setSelectedPipelineId(value === "all" ? undefined : value)
                }
              >
                <SelectTrigger id="pipelineFilter" className="w-full">
                  <SelectValue placeholder="All Pipelines" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="bg-background z-100"
                >
                  <SelectItem value="all">All Pipelines</SelectItem>
                  {pipelines.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label
                htmlFor="tagFilter"
                className="text-sm font-medium mb-1.5 block"
              >
                Filter by Tags
              </Label>
              <TagFilter
                tags={availableTags}
                selectedTagIds={selectedTagIds}
                onChange={setSelectedTagIds}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPipelineId(undefined);
                  setSelectedTagIds([]);
                }}
                disabled={!hasActiveFilters}
                className="h-10"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
