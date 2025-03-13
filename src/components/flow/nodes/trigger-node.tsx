
import { Handle, Position, useEdges } from '@xyflow/react';
import { Zap } from 'lucide-react';
import { useState, useContext, useEffect } from 'react';
import { NodeUpdateContext } from '@/components/flow/agent-flow/flow';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NodeStatusIndicator } from '@/components/flow/node-status-indicator';

const PLATFORM_OPTIONS = [
  { value: 'voice', label: 'Voice Call' },
  { value: 'website', label: 'Website Chat' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
];

const ACTION_OPTIONS = {
  voice: [
    { value: 'incoming', label: 'Incoming Call' },
    { value: 'scheduled', label: 'Scheduled Call' },
  ],
  website: [
    { value: 'user_initiated', label: 'User Initiated' },
    { value: 'auto_prompt', label: 'Auto Prompt' },
  ],
  whatsapp: [
    { value: 'incoming', label: 'Incoming Message' },
    { value: 'keyword', label: 'Keyword Trigger' },
  ],
  sms: [
    { value: 'incoming', label: 'Incoming SMS' },
    { value: 'keyword', label: 'Keyword Trigger' },
  ],
};

export function TriggerNode({ id, data }: { id: string; data: any }) {
  const [platform, setPlatform] = useState<string | undefined>(data?.platform);
  const [action, setAction] = useState<string | undefined>(data?.action);
  const { updateNodeData } = useContext(NodeUpdateContext);
  const edges = useEdges();
  
  // Check if this node has any outgoing connections
  const hasConnection = edges.some(edge => edge.source === id);

  // Sync with incoming data changes
  useEffect(() => {
    if (data?.platform !== undefined && data.platform !== platform) {
      setPlatform(data.platform);
    }
    
    if (data?.action !== undefined && data.action !== action) {
      setAction(data.action);
    }
  }, [data, platform, action]);

  const handlePlatformChange = (value: string) => {
    setPlatform(value);
    setAction(undefined);
    updateNodeData(id, { platform: value, action: undefined });
  };

  const handleActionChange = (value: string) => {
    setAction(value);
    updateNodeData(id, { platform, action: value });
  };

  return (
    <NodeStatusIndicator 
      hasConnection={hasConnection}
      animation={hasConnection ? "glow" : "none"}
    >
      <div className="group relative">
        {/* Glowing background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-orange-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-amber-200/50 dark:border-amber-800/50 shadow-[0_8px_16px_-6px_rgba(251,191,36,0.4)] dark:shadow-[0_8px_16px_-6px_rgba(251,191,36,0.15)] p-5 min-w-[260px] transition-all duration-500 hover:translate-y-[-2px] hover:shadow-[0_20px_40px_-12px_rgba(251,191,36,0.4)] dark:hover:shadow-[0_20px_40px_-12px_rgba(251,191,36,0.15)]">
          <div className="flex items-center gap-3 mb-3">
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-lg bg-amber-400 opacity-20" />
              <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg">
                <Zap className="h-4 w-4" />
              </span>
            </span>
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
              Flow Trigger
            </span>
          </div>
          
          <div className="mt-2 space-y-4">
            <div>
              <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Platform</Label>
              <Select value={platform} onValueChange={handlePlatformChange}>
                <SelectTrigger className="w-full bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {platform && (
              <div>
                <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Trigger Type</Label>
                <Select value={action} onValueChange={handleActionChange}>
                  <SelectTrigger className="w-full bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                    <SelectValue placeholder="Select trigger type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_OPTIONS[platform as keyof typeof ACTION_OPTIONS]?.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        
        <Handle 
          type="source" 
          position={Position.Right}
          className="!w-3 !h-3 !bg-amber-400 !rounded-full border-none" 
        />
      </div>
    </NodeStatusIndicator>
  );
}
