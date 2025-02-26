
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { VariableBadge } from "./variables/variable-badge";
import { LeadVariable } from "@/pages/dashboard/leads";
import { EmptyState } from "./variables/empty-state";

export interface LeadVariablesProps {
  leadId: string;
  variables: LeadVariable[];
  onEdit?: (variable: LeadVariable) => void;
  onDelete?: (id: string) => void;
  onAddClick?: () => void;
  onVariablesUpdated?: () => void;
}

export function LeadVariables({
  variables,
  onEdit = () => {},
  onDelete = () => {},
  onAddClick = () => {},
}: LeadVariablesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Variables</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddClick}
          className="h-9 px-4 rounded-lg border-gray-200"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Variable
        </Button>
      </div>

      {variables.length === 0 ? (
        <EmptyState onAddClick={onAddClick} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {variables.map((variable) => (
            <VariableBadge
              key={variable.id}
              variable={variable}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
