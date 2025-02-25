import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Network } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TriggerPlatform = 'facebook' | 'hubspot' | 'gohighlevel' | 'activix';
type TriggerAction = 
  | 'new_lead'           // Facebook
  | 'message_received'   // Facebook
  | 'new_contact'        // Hubspot
  | 'deal_stage_changed' // Hubspot
  | 'contact_created'    // GoHighLevel
  | 'opportunity_won'    // GoHighLevel
  | 'ticket_created'     // Activix
  | 'payment_received';  // Activix

interface TriggerNodeData {
  platform?: TriggerPlatform;
  action?: TriggerAction;
}

const platforms: { value: TriggerPlatform; label: string; icon: JSX.Element }[] = [
  { value: 'facebook', label: 'Facebook', icon: <Network className="h-4 w-4" /> },
  { value: 'hubspot', label: 'Hubspot', icon: <Network className="h-4 w-4" /> },
  { value: 'gohighlevel', label: 'GoHighLevel', icon: <Network className="h-4 w-4" /> },
  { value: 'activix', label: 'Activix', icon: <Network className="h-4 w-4" /> },
];

const platformActions: Record<TriggerPlatform, { value: TriggerAction; label: string }[]> = {
  facebook: [
    { value: 'new_lead', label: 'New Lead' },
    { value: 'message_received', label: 'Message Received' },
  ],
  hubspot: [
    { value: 'new_contact', label: 'New Contact' },
    { value: 'deal_stage_changed', label: 'Deal Stage Changed' },
  ],
  gohighlevel: [
    { value: 'contact_created', label: 'Contact Created' },
    { value: 'opportunity_won', label: 'Opportunity Won' },
  ],
  activix: [
    { value: 'ticket_created', label: 'Ticket Created' },
    { value: 'payment_received', label: 'Payment Received' },
  ],
};

export function TriggerNode({ id, data }: { id: string; data: TriggerNodeData }) {
  const [platform, setPlatform] = useState<TriggerPlatform | undefined>(data.platform);
  const [action, setAction] = useState<TriggerAction | undefined>(data.action);

  const handlePlatformChange = (value: TriggerPlatform) => {
    setPlatform(value);
    setAction(undefined);
    const evt = new CustomEvent('nodeupdate', {
      detail: { id, data: { platform: value, action: undefined } },
    });
    window.dispatchEvent(evt);
  };

  const handleActionChange = (value: TriggerAction) => {
    setAction(value);
    const evt = new CustomEvent('nodeupdate', {
      detail: { id, data: { platform, action: value } },
    });
    window.dispatchEvent(evt);
  };

  return (
    <div className="relative group bg-gradient-to-br from-amber-50/90 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl border border-amber-100/50 dark:border-gray-700/50 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5),0_2px_4px_-2px_rgba(0,0,0,0.25)] backdrop-blur-xl p-4 min-w-[300px] transition-all duration-300 bg-[length:200%_200%] animate-breathing hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)] dark:hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)] hover:translate-y-[-2px] hover:z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-transparent dark:from-amber-500/[0.05] rounded-xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
      <div className="fixed inset-0 -z-10 bg-amber-500/[0.01] dark:bg-amber-400/[0.02] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-amber-100/50 dark:border-gray-700/50">
          <span className="text-amber-500 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/50 p-1.5 rounded-md">
            <Network className="h-4 w-4" />
          </span>
          <span className="font-medium text-amber-700 dark:text-amber-300">Trigger</span>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-amber-600/75 dark:text-amber-300/75">
            Select Platform
          </Label>
          <Select value={platform} onValueChange={handlePlatformChange}>
            <SelectTrigger className="bg-white/80 dark:bg-gray-900/50 border-amber-100/50 dark:border-amber-800/50 shadow-sm">
              <SelectValue placeholder="Choose platform" />
            </SelectTrigger>
            <SelectContent>
              {platforms.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  <div className="flex items-center gap-2">
                    {p.icon}
                    <span>{p.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {platform && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-amber-600/75 dark:text-amber-300/75">
              Select Trigger
            </Label>
            <Select value={action} onValueChange={handleActionChange}>
              <SelectTrigger className="bg-white/80 dark:bg-gray-900/50 border-amber-100/50 dark:border-amber-800/50 shadow-sm">
                <SelectValue placeholder="Choose trigger" />
              </SelectTrigger>
              <SelectContent>
                {platformActions[platform].map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-4 !bg-amber-400 rounded-sm border-none transition-all duration-300 hover:!bg-amber-500"
      />
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-amber-500/[0.03] pointer-events-none" />
    </div>
  );
}
