
import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { PhoneForwarded } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TransferNodeData {
  message?: string;
  phoneNumber?: string;
  contactName?: string;
}

export function TransferNode({ data }: { data: TransferNodeData }) {
  const [message, setMessage] = useState(data.message || "Transferring call now...");
  const [phoneNumber, setPhoneNumber] = useState(data.phoneNumber || "");
  const [contactName, setContactName] = useState(data.contactName || "");

  const handleChange = (field: keyof TransferNodeData, value: string) => {
    const updatedData = {
      message,
      phoneNumber,
      contactName,
      [field]: value
    };
    
    // Dispatch event to update node data in the flow
    const evt = new CustomEvent('nodeupdate', {
      detail: {
        id: "transfer-node",
        data: updatedData
      }
    });
    window.dispatchEvent(evt);

    // Update local state
    switch(field) {
      case 'message':
        setMessage(value);
        break;
      case 'phoneNumber':
        setPhoneNumber(value);
        break;
      case 'contactName':
        setContactName(value);
        break;
    }
  };

  return (
    <div className="relative group bg-gradient-to-br from-emerald-50/90 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl border border-emerald-100/50 dark:border-gray-700/50 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5),0_2px_4px_-2px_rgba(0,0,0,0.25)] backdrop-blur-xl p-4 min-w-[300px] transition-transform duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent dark:from-emerald-500/[0.05] rounded-xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-emerald-100/50 dark:border-gray-700/50">
          <span className="text-emerald-500 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/50 p-1.5 rounded-md">
            <PhoneForwarded className="h-4 w-4" />
          </span>
          <span className="font-medium text-emerald-700 dark:text-emerald-300">Transfer Call</span>
        </div>

        <div className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-emerald-600/75 dark:text-emerald-300/75">
              Transfer Message
            </Label>
            <Input
              value={message}
              onChange={(e) => handleChange('message', e.target.value)}
              className="bg-white/80 dark:bg-gray-900/50 border-emerald-100/50 dark:border-emerald-800/50 shadow-sm"
              placeholder="Enter transfer message..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-emerald-600/75 dark:text-emerald-300/75">
              Contact Name
            </Label>
            <Input
              value={contactName}
              onChange={(e) => handleChange('contactName', e.target.value)}
              className="bg-white/80 dark:bg-gray-900/50 border-emerald-100/50 dark:border-emerald-800/50 shadow-sm"
              placeholder="Enter contact name..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-emerald-600/75 dark:text-emerald-300/75">
              Phone Number
            </Label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              className="bg-white/80 dark:bg-gray-900/50 border-emerald-100/50 dark:border-emerald-800/50 shadow-sm"
              placeholder="Enter phone number..."
            />
          </div>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-4 !bg-emerald-400 rounded-sm border-none transition-all duration-300 hover:!bg-emerald-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-4 !bg-emerald-400 rounded-sm border-none transition-all duration-300 hover:!bg-emerald-500"
      />
      
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-emerald-500/[0.03] pointer-events-none" />
    </div>
  );
}
