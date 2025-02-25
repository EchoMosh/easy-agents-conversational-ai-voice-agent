import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Network } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TriggerPlatform = 'facebook' | 'hubspot' | 'gohighlevel' | 'activix';
type TriggerAction = 'new_lead' | 'message_received' | 'new_contact' | 'deal_stage_changed' | 'contact_created' | 'opportunity_won' | 'ticket_created' | 'payment_received';

interface TriggerNodeData {
  platform?: TriggerPlatform;
  action?: TriggerAction;
}

const platforms: {
  value: TriggerPlatform;
  label: string;
  icon: JSX.Element;
}[] = [{
  value: 'facebook',
  label: 'Facebook',
  icon: <Network className="h-4 w-4" />
}, {
  value: 'hubspot',
  label: 'Hubspot',
  icon: <Network className="h-4 w-4" />
}, {
  value: 'gohighlevel',
  label: 'GoHighLevel',
  icon: <Network className="h-4 w-4" />
}, {
  value: 'activix',
  label: 'Activix',
  icon: <Network className="h-4 w-4" />
}];

const platformActions: Record<TriggerPlatform, {
  value: TriggerAction;
  label: string;
}[]> = {
  facebook: [{
    value: 'new_lead',
    label: 'New Lead'
  }, {
    value: 'message_received',
    label: 'Message Received'
  }],
  hubspot: [{
    value: 'new_contact',
    label: 'New Contact'
  }, {
    value: 'deal_stage_changed',
    label: 'Deal Stage Changed'
  }],
  gohighlevel: [{
    value: 'contact_created',
    label: 'Contact Created'
  }, {
    value: 'opportunity_won',
    label: 'Opportunity Won'
  }],
  activix: [{
    value: 'ticket_created',
    label: 'Ticket Created'
  }, {
    value: 'payment_received',
    label: 'Payment Received'
  }]
};

export function TriggerNode({
  id,
  data
}: {
  id: string;
  data: TriggerNodeData;
}) {
  const [platform, setPlatform] = useState<TriggerPlatform | undefined>(data.platform);
  const [action, setAction] = useState<TriggerAction | undefined>(data.action);

  const handlePlatformChange = (value: TriggerPlatform) => {
    setPlatform(value);
    setAction(undefined);
    const evt = new CustomEvent('nodeupdate', {
      detail: {
        id,
        data: {
          platform: value,
          action: undefined
        }
      }
    });
    window.dispatchEvent(evt);
  };

  const handleActionChange = (value: TriggerAction) => {
    setAction(value);
    const evt = new CustomEvent('nodeupdate', {
      detail: {
        id,
        data: {
          platform,
          action: value
        }
      }
    });
    window.dispatchEvent(evt);
  };

  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-amber-200/50 dark:border-amber-800/50 shadow-[0_8px_16px_-6px_rgba(245,158,11,0.2)] dark:shadow-[0_8px_16px_-6px_rgba(245,158,11,0.3)] p-5 min-w-[300px] transition-all duration-500 hover:translate-y-[-2px] hover:shadow-[0_20px_40px_-12px_rgba(245,158,11,0.4)] dark:hover:shadow-[0_20px_40px_-12px_rgba(245,158,11,0.5)]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-lg bg-amber-400 opacity-20" />
              <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg">
                <Network className="h-4 w-4" />
              </span>
            </span>
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
              Trigger
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-amber-600/75 dark:text-amber-300/75">
              Select Platform
            </Label>
            <Select value={platform} onValueChange={handlePlatformChange}>
              <SelectTrigger className="bg-white/40 dark:bg-gray-900/40 border-amber-200/50 dark:border-amber-800/50">
                <SelectValue placeholder="Choose platform" />
              </SelectTrigger>
              <SelectContent>
                {platforms.map(p => (
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
                <SelectTrigger className="bg-white/40 dark:bg-gray-900/40 border-amber-200/50 dark:border-amber-800/50">
                  <SelectValue placeholder="Choose trigger" />
                </SelectTrigger>
                <SelectContent>
                  {platformActions[platform].map(a => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
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
        className="!w-2 !h-4 !bg-amber-400 rounded-sm border-none !right-[-8px] transition-all duration-300 hover:!bg-amber-500" 
      />
    </div>
  );
}
