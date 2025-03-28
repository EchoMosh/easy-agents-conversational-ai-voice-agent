import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface PipelineSelectorTestProps {
  pipelines: Array<{ id: string; name: string }>;
  onSelected: (pipelineId: string) => void;
}

export function PipelineSelectorTest({
  pipelines,
  onSelected,
}: PipelineSelectorTestProps) {
  return (
    <div className="space-y-2 p-4">
      <h3 className="font-medium mb-2">Select a Pipeline:</h3>
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => onSelected("none")}
        >
          No Pipeline
        </Button>

        {pipelines.map((pipeline) => (
          <Button
            key={pipeline.id}
            variant="outline"
            className="w-full justify-start"
            onClick={() => onSelected(pipeline.id)}
          >
            {pipeline.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
