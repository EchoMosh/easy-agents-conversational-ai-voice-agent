
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { ReactNode } from "react";

interface SearchAndFiltersProps {
  selectedPipelineId: string | undefined;
  setSelectedPipelineId: (id: string | undefined) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  pipelines: Array<{ id: string; name: string }>;
  addLeadDialog?: ReactNode;
}

export function SearchAndFilters({
  selectedPipelineId,
  setSelectedPipelineId,
  searchQuery,
  setSearchQuery,
  pipelines,
  addLeadDialog
}: SearchAndFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-4 items-end">
      <div className="w-64">
        <Label htmlFor="pipelineFilter">Filter by Pipeline</Label>
        <Select 
          value={selectedPipelineId || "all"} 
          onValueChange={(value) => setSelectedPipelineId(value === "all" ? undefined : value)}
        >
          <SelectTrigger id="pipelineFilter">
            <SelectValue placeholder="All Pipelines" />
          </SelectTrigger>
          <SelectContent position="popper" className="bg-background z-50">
            <SelectItem value="all">All Pipelines</SelectItem>
            {pipelines.map((pipeline) => (
              <SelectItem key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Search bar */}
      <div className="flex-1">
        <Label htmlFor="searchLeads">Search Leads</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="searchLeads"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Add Lead button */}
      <div className="ml-auto">
        {addLeadDialog}
      </div>
    </div>
  );
}
