
import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function SpeakNode({ data }: { data: { message: string } }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-4 min-w-[300px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 rounded-full bg-gray-300 border-2 border-white dark:border-gray-800" />
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-purple-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v12"/><path d="M8 10v4"/><path d="M16 10v4"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
          </span>
          <span className="font-medium dark:text-white">Speak</span>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="message" className="text-xs text-muted-foreground dark:text-gray-400">
            Enter message
          </Label>
          <Textarea 
            id="message"
            value={data.message}
            onChange={(event) => {
              const evt = new CustomEvent('nodeupdate', {
                detail: { data: { message: event.target.value } },
              });
              window.dispatchEvent(evt);
            }}
            className="nodrag text-sm resize-y min-h-[80px] bg-white dark:bg-gray-900 border shadow-sm"
            placeholder="Type your message..."
          />
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 rounded-full bg-gray-300 border-2 border-white dark:border-gray-800" />
    </div>
  );
}
