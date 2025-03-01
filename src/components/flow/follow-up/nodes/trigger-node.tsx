
import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface TriggerNodeProps {
  data: {
    label: string;
    outcomes?: string[];
  };
  isConnectable?: boolean;
}

export function TriggerNode({ data, isConnectable }: TriggerNodeProps) {
  return (
    <div className="relative rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-900 p-3 w-48 shadow-md">
      <div className="font-semibold text-blue-700 dark:text-blue-200 text-sm mb-1">Trigger</div>
      <div className="text-blue-900 dark:text-blue-50 text-xs">
        {data.label}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500"
      />
    </div>
  );
}
