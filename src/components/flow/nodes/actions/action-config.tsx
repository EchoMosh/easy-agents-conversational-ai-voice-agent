
import { NodeAction } from '@/types/agent-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { useState } from 'react';

export interface ActionConfigProps {
  action: NodeAction;
  onChange: (updatedAction: NodeAction) => void;
  onDelete: (id: string) => void;
}

export function ActionConfig({ action, onChange, onDelete }: ActionConfigProps) {
  const [url, setUrl] = useState(action.config.url || '');

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    const updatedAction = {
      ...action,
      config: {
        ...action.config,
        url: newUrl
      }
    };
    
    onChange(updatedAction);
  };

  return (
    <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl p-3 rounded-xl border border-white/20 dark:border-gray-700/30 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
          {action.type} Action
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-gray-500 hover:text-red-500"
          onClick={() => onDelete(action.id)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      {action.type === 'webhook' && (
        <div className="space-y-2">
          <Input
            placeholder="Enter webhook URL"
            value={url}
            onChange={handleUrlChange}
            className="h-8 text-xs"
          />
        </div>
      )}
      
      {action.type === 'sms' && (
        <div className="space-y-2">
          <Input
            placeholder="Enter phone number"
            value={action.config.phoneNumber || ''}
            onChange={(e) => {
              onChange({
                ...action,
                config: {
                  ...action.config,
                  phoneNumber: e.target.value
                }
              });
            }}
            className="h-8 text-xs"
          />
          <Input
            placeholder="Enter message"
            value={action.config.message || ''}
            onChange={(e) => {
              onChange({
                ...action,
                config: {
                  ...action.config,
                  message: e.target.value
                }
              });
            }}
            className="h-8 text-xs"
          />
        </div>
      )}
      
      {action.type === 'email' && (
        <div className="space-y-2">
          <Input
            placeholder="Enter email address"
            value={action.config.email || ''}
            onChange={(e) => {
              onChange({
                ...action,
                config: {
                  ...action.config,
                  email: e.target.value
                }
              });
            }}
            className="h-8 text-xs"
          />
          <Input
            placeholder="Enter subject"
            value={action.config.subject || ''}
            onChange={(e) => {
              onChange({
                ...action,
                config: {
                  ...action.config,
                  subject: e.target.value
                }
              });
            }}
            className="h-8 text-xs"
          />
        </div>
      )}
    </div>
  );
}
