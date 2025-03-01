
import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface DelayNodeProps {
  data: {
    label: string;
  };
  isConnectable?: boolean;
}

export function DelayNode({ data, isConnectable }: DelayNodeProps) {
  return (
    <div className="relative rounded-lg border-2 border-blue-500 bg-white dark:bg-gray-800 p-3 w-48 shadow-md">
      <div className="font-semibold text-blue-700 dark:text-blue-200 text-sm mb-1">Delay</div>
      <div className="text-gray-700 dark:text-gray-300 text-xs">
        {data.label}
      </div>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500"
      />
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
