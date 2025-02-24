
import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Facebook, MessageSquare, Network, XCircle } from 'lucide-react';
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
  { value: 'facebook', label: 'Facebook', icon: <Facebook className="h-4 w-4" /> },
  { value: 'hubspot', label: 'Hubspot', icon: <Network className="h-4 w-4" /> },
  { value: 'gohighlevel', label: 'GoHighLevel', icon: <MessageSquare className="h-4 w-4" /> },
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-4 min-w-[300px]">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-orange-500">
            <Network className="h-4 w-4" />
          </span>
          <span className="font-medium dark:text-white">Trigger</span>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground dark:text-gray-400">
            Select Platform
          </Label>
          <Select value={platform} onValueChange={handlePlatformChange}>
            <SelectTrigger>
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
            <Label className="text-xs text-muted-foreground dark:text-gray-400">
              Select Trigger
            </Label>
            <Select value={action} onValueChange={handleActionChange}>
              <SelectTrigger>
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
        className="w-3 h-3 rounded-full bg-gray-300 border-2 border-white dark:border-gray-800"
      />
    </div>
  );
}
