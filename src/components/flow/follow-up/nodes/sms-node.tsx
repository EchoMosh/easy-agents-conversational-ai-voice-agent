
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';

interface SmsNodeProps {
  data: {
    label: string;
    message?: string;
  };
  isConnectable?: boolean;
}

export function SmsNode({ data, isConnectable }: SmsNodeProps) {
  return (
    <div className="relative rounded-lg border-2 border-green-500 bg-white dark:bg-gray-800 p-3 w-48 shadow-md">
      <div className="font-semibold text-green-700 dark:text-green-200 text-sm mb-1 flex items-center">
        <MessageSquare className="h-3 w-3 mr-1" /> SMS
      </div>
      <div className="text-gray-700 dark:text-gray-300 text-xs">
        {data.label}
      </div>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-green-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-green-500"
      />
    </div>
  );
}
