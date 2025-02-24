
import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function GreetingNode({ data, id }: { data: { greeting: string }; id: string }) {
  const handleGreetingChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    // We need to manually trigger a node update since we're modifying data
    const evt = new CustomEvent('nodeupdate', {
      detail: { id, data: { greeting: event.target.value } },
    });
    window.dispatchEvent(evt);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-4 min-w-[200px]">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          </span>
          <span className="font-medium dark:text-white">Greeting</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`greeting-${id}`} className="text-xs text-muted-foreground dark:text-gray-400">
            Enter greeting message
          </Label>
          <Textarea 
            id={`greeting-${id}`}
            value={data.greeting}
            onChange={handleGreetingChange}
            className="nodrag text-sm resize-y min-h-[60px]" // Added resize-y for vertical resizing
            placeholder="Type your greeting message..."
          />
        </div>
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 rounded-full bg-gray-300 border-2 border-white dark:border-gray-800" 
      />
    </div>
  );
}
