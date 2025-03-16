
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  MoveRight, 
  Tag, 
  RefreshCw,
  ChevronDown,
  ClipboardCheck,
  MailPlus
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface SelectionHeaderProps {
  selectedCount: number;
  onDelete: () => void;
  isDeleting: boolean;
  onMoveToPipeline?: (pipelineId: string) => void;
  onChangeStatus?: (status: string) => void;
  onAddVariables?: () => void;
  pipelines?: Array<{ id: string; name: string; }>;
}

export function SelectionHeader({ 
  selectedCount, 
  onDelete, 
  isDeleting,
  onMoveToPipeline,
  onChangeStatus,
  onAddVariables,
  pipelines = []
}: SelectionHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (selectedCount === 0) return null;

  const handleCopyEmails = () => {
    // This function would be implemented in the parent component
    // and passed as a prop
    toast.success("Emails copied to clipboard");
  };

  const handleSendEmail = () => {
    // This would open an email composition dialog
    toast.info("Email composition feature coming soon");
  };

  return (
    <div className="mb-4 flex items-center justify-between bg-background border rounded-lg p-4 shadow-sm">
      <span className="font-medium text-foreground">
        {selectedCount} lead{selectedCount > 1 ? 's' : ''} selected
      </span>
      <div className="flex items-center gap-2">
        {onChangeStatus && (
          <Select onValueChange={onChangeStatus}>
            <SelectTrigger className="w-[170px] h-9 bg-background">
              <span className="flex items-center text-sm">
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Change Status
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="Qualified">Qualified</SelectItem>
                <SelectItem value="Proposal">Proposal</SelectItem>
                <SelectItem value="Negotiation">Negotiation</SelectItem>
                <SelectItem value="Won">Won</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        )}

        {onMoveToPipeline && pipelines.length > 0 && (
          <Select onValueChange={onMoveToPipeline}>
            <SelectTrigger className="w-[170px] h-9 bg-background">
              <span className="flex items-center text-sm">
                <MoveRight className="h-3.5 w-3.5 mr-2" />
                Move to Pipeline
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="none">No Pipeline</SelectItem>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <span className="flex items-center text-sm">
                More Actions
                <ChevronDown className="h-3.5 w-3.5 ml-2" />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {onAddVariables && (
              <DropdownMenuItem onClick={onAddVariables}>
                <Tag className="h-4 w-4 mr-2" />
                Add Variables
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleCopyEmails}>
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Copy Emails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSendEmail}>
              <MailPlus className="h-4 w-4 mr-2" />
              Send Email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onDelete} 
              disabled={isDeleting}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
