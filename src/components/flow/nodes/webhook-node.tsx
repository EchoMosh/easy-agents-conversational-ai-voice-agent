
import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Webhook } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type WebhookMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface WebhookNodeData {
  url?: string;
  method?: WebhookMethod;
  headers?: Record<string, string>;
}

export function WebhookNode({
  id,
  data
}: {
  id: string;
  data: WebhookNodeData;
}) {
  const [url, setUrl] = useState<string>(data.url || '');
  const [method, setMethod] = useState<WebhookMethod>(data.method || 'GET');

  const handleUrlChange = (value: string) => {
    setUrl(value);
    const evt = new CustomEvent('nodeupdate', {
      detail: {
        id,
        data: {
          ...data,
          url: value
        }
      }
    });
    window.dispatchEvent(evt);
  };

  const handleMethodChange = (value: WebhookMethod) => {
    setMethod(value);
    const evt = new CustomEvent('nodeupdate', {
      detail: {
        id,
        data: {
          ...data,
          method: value
        }
      }
    });
    window.dispatchEvent(evt);
  };

  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-indigo-200/50 dark:border-indigo-800/50 shadow-[0_8px_16px_-6px_rgba(99,102,241,0.2)] dark:shadow-[0_8px_16px_-6px_rgba(99,102,241,0.3)] p-5 min-w-[300px] transition-all duration-500 hover:translate-y-[-2px] hover:shadow-[0_20px_40px_-12px_rgba(99,102,241,0.4)] dark:hover:shadow-[0_20px_40px_-12px_rgba(99,102,241,0.5)]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-lg bg-indigo-400 opacity-20" />
              <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg">
                <Webhook className="h-4 w-4" />
              </span>
            </span>
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
              Webhook
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-indigo-600/75 dark:text-indigo-300/75">
              Request Method
            </Label>
            <Select value={method} onValueChange={handleMethodChange}>
              <SelectTrigger className="bg-white/40 dark:bg-gray-900/40 border-indigo-200/50 dark:border-indigo-800/50">
                <SelectValue placeholder="Choose method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-indigo-600/75 dark:text-indigo-300/75">
              Webhook URL
            </Label>
            <Input
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/webhook"
              className="bg-white/40 dark:bg-gray-900/40 border-indigo-200/50 dark:border-indigo-800/50"
            />
          </div>
        </div>
      </div>

      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-2 !h-4 !bg-indigo-400 rounded-sm border-none !left-[-8px] transition-all duration-300 hover:!bg-indigo-500" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-2 !h-4 !bg-indigo-400 rounded-sm border-none !right-[-8px] transition-all duration-300 hover:!bg-indigo-500" 
      />
    </div>
  );
}
