
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface FlowHeaderProps {
  agentName: string;
  onSave?: () => void;
}

export function FlowHeader({ agentName, onSave }: FlowHeaderProps) {
  return (
    <div className="px-4 py-3 flex justify-between items-center border-b">
      <h1 className="text-xl font-medium">{agentName} Flow</h1>
      {onSave && (
        <Button size="sm" onClick={onSave} className="gap-1">
          <Save className="h-4 w-4" />
          <span>Save</span>
        </Button>
      )}
    </div>
  );
}
