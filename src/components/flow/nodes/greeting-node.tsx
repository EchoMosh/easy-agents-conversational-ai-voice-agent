
import { Handle, Position } from '@xyflow/react';

export function GreetingNode({ data }: { data: { greeting: string } }) {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 min-w-[200px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 rounded-full bg-gray-300 border-2 border-white" />
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          </span>
          <span className="font-medium">Greeting</span>
        </div>
        <p className="text-sm text-muted-foreground">{data.greeting}</p>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 rounded-full bg-gray-300 border-2 border-white" />
    </div>
  );
}
