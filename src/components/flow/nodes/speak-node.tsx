
import { Handle, Position } from '@xyflow/react';

export function SpeakNode({ data }: { data: { message: string } }) {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 min-w-[200px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 rounded-full bg-gray-300 border-2 border-white" />
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-purple-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v12"/><path d="M8 10v4"/><path d="M16 10v4"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
          </span>
          <span className="font-medium">Speak</span>
        </div>
        <p className="text-sm text-muted-foreground">{data.message}</p>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 rounded-full bg-gray-300 border-2 border-white" />
    </div>
  );
}
