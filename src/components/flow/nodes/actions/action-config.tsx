
import { NodeAction } from '@/types/agent-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ActionConfigProps {
  action: NodeAction;
  onChange: (updatedAction: NodeAction) => void;
}

export function ActionConfig({ action, onChange }: ActionConfigProps) {
  const handleConfigChange = (key: string, value: any) => {
    const updatedAction = {
      ...action,
      config: {
        ...action.config,
        [key]: value
      }
    };
    onChange(updatedAction);
  };

  switch (action.type) {
    case 'sms':
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Phone Number</Label>
            <Input 
              className="text-xs" 
              placeholder="+1234567890"
              value={action.config.phoneNumber || ''}
              onChange={(e) => handleConfigChange('phoneNumber', e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Message</Label>
            <Textarea 
              className="text-xs min-h-[80px]" 
              placeholder="Enter SMS message"
              value={action.config.message || ''}
              onChange={(e) => handleConfigChange('message', e.target.value)}
            />
          </div>
        </div>
      );
    
    case 'webhook':
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">URL</Label>
            <Input 
              className="text-xs" 
              placeholder="https://example.com/webhook"
              value={action.config.url || ''}
              onChange={(e) => handleConfigChange('url', e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Method</Label>
            <select 
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={action.config.method || 'POST'}
              onChange={(e) => handleConfigChange('method', e.target.value)}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Payload (JSON)</Label>
            <Textarea 
              className="text-xs min-h-[80px] font-mono" 
              placeholder='{"key": "value"}'
              value={action.config.payload || ''}
              onChange={(e) => handleConfigChange('payload', e.target.value)}
            />
          </div>
        </div>
      );
    
    case 'email':
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">To</Label>
            <Input 
              className="text-xs" 
              placeholder="recipient@example.com"
              value={action.config.to || ''}
              onChange={(e) => handleConfigChange('to', e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Subject</Label>
            <Input 
              className="text-xs" 
              placeholder="Email subject"
              value={action.config.subject || ''}
              onChange={(e) => handleConfigChange('subject', e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Message</Label>
            <Textarea 
              className="text-xs min-h-[80px]" 
              placeholder="Email content"
              value={action.config.message || ''}
              onChange={(e) => handleConfigChange('message', e.target.value)}
            />
          </div>
        </div>
      );
    
    default:
      return <div>Unknown action type</div>;
  }
}
