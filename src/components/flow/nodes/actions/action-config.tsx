
import { NodeAction } from '@/types/agent-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

interface ActionConfigProps {
  action: NodeAction;
  onChange: (updatedAction: NodeAction) => void;
}

export function ActionConfig({ action, onChange }: ActionConfigProps) {
  const [jsonValid, setJsonValid] = useState(true);

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

  const validateJson = (value: string) => {
    try {
      JSON.parse(value);
      setJsonValid(true);
      return true;
    } catch (e) {
      setJsonValid(false);
      return false;
    }
  };

  switch (action.type) {
    case 'sms':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="phoneNumber" className="text-xs mb-1.5 block">Phone Number</Label>
            <Input 
              id="phoneNumber"
              className="text-xs" 
              placeholder="+1234567890"
              value={action.config.phoneNumber || ''}
              onChange={(e) => handleConfigChange('phoneNumber', e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Include country code, e.g. +1 for US</p>
          </div>
          <div>
            <Label htmlFor="smsMessage" className="text-xs mb-1.5 block">Message</Label>
            <Textarea 
              id="smsMessage"
              className="text-xs min-h-[100px]" 
              placeholder="Enter SMS message"
              value={action.config.message || ''}
              onChange={(e) => handleConfigChange('message', e.target.value)}
            />
            <div className="flex items-center gap-2 mt-2">
              <Checkbox 
                id="smsConfirmation" 
                checked={action.config.sendConfirmation || false}
                onCheckedChange={(checked) => handleConfigChange('sendConfirmation', checked)}
              />
              <Label htmlFor="smsConfirmation" className="text-xs cursor-pointer">
                Ask for confirmation before sending
              </Label>
            </div>
          </div>
        </div>
      );
    
    case 'webhook':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="webhookUrl" className="text-xs mb-1.5 block">URL</Label>
            <Input 
              id="webhookUrl"
              className="text-xs" 
              placeholder="https://example.com/webhook"
              value={action.config.url || ''}
              onChange={(e) => handleConfigChange('url', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="webhookMethod" className="text-xs mb-1.5 block">Method</Label>
            <select 
              id="webhookMethod"
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={action.config.method || 'POST'}
              onChange={(e) => handleConfigChange('method', e.target.value)}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <Label htmlFor="webhookPayload" className="text-xs">Payload (JSON)</Label>
              {!jsonValid && <span className="text-xs text-destructive">Invalid JSON</span>}
            </div>
            <Textarea 
              id="webhookPayload"
              className={`text-xs min-h-[120px] font-mono ${!jsonValid ? 'border-destructive' : ''}`}
              placeholder='{"key": "value"}'
              value={action.config.payload || ''}
              onChange={(e) => {
                const value = e.target.value;
                handleConfigChange('payload', value);
                // Only validate if there's actual content
                if (value.trim()) validateJson(value);
              }}
              onBlur={(e) => {
                // Format JSON on blur if valid
                if (e.target.value.trim() && validateJson(e.target.value)) {
                  try {
                    const formatted = JSON.stringify(JSON.parse(e.target.value), null, 2);
                    handleConfigChange('payload', formatted);
                  } catch (e) {
                    // Fallback if formatting fails
                  }
                }
              }}
            />
            <div className="flex items-center gap-2 mt-2">
              <Checkbox 
                id="webhookAsync" 
                checked={action.config.async || false}
                onCheckedChange={(checked) => handleConfigChange('async', checked)}
              />
              <Label htmlFor="webhookAsync" className="text-xs cursor-pointer">
                Execute asynchronously (don't wait for response)
              </Label>
            </div>
          </div>
        </div>
      );
    
    case 'email':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="emailTo" className="text-xs mb-1.5 block">To</Label>
            <Input 
              id="emailTo"
              className="text-xs" 
              placeholder="recipient@example.com"
              value={action.config.to || ''}
              onChange={(e) => handleConfigChange('to', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="emailSubject" className="text-xs mb-1.5 block">Subject</Label>
            <Input 
              id="emailSubject"
              className="text-xs" 
              placeholder="Email subject"
              value={action.config.subject || ''}
              onChange={(e) => handleConfigChange('subject', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="emailMessage" className="text-xs mb-1.5 block">Message</Label>
            <Textarea 
              id="emailMessage"
              className="text-xs min-h-[120px]" 
              placeholder="Email content"
              value={action.config.message || ''}
              onChange={(e) => handleConfigChange('message', e.target.value)}
            />
            <div className="flex items-center gap-2 mt-2">
              <Checkbox 
                id="emailHtml" 
                checked={action.config.isHtml || false}
                onCheckedChange={(checked) => handleConfigChange('isHtml', checked)}
              />
              <Label htmlFor="emailHtml" className="text-xs cursor-pointer">
                Send as HTML
              </Label>
            </div>
          </div>
        </div>
      );
    
    default:
      return <div>Unknown action type</div>;
  }
}
