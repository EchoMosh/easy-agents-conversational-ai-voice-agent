import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { VoiceCall } from './AgentCallLogsModal';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from 'lucide-react';

interface CallLogListItemProps {
  call: VoiceCall;
  isSelected: boolean;
  onSelect: () => void;
  agentName?: string; // Pass agent name for display in details
}

const CallLogListItem: React.FC<CallLogListItemProps> = ({ call, isSelected, onSelect, agentName }) => {
  const callDate = new Date(call.createdAt);
  const formattedTime = callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDateFull = callDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const callStartTime = formattedTime; // For "Time" field in details

  const getInitial = (name?: string) => name ? name.charAt(0).toUpperCase() : 'C';
  // Use a more generic display name for the compact view if summary is long or unavailable
  const compactDisplayName = call.summary 
    ? (call.summary.length > 30 ? call.summary.substring(0, 27) + "..." : call.summary)
    : `Call on ${formattedDateFull}`;

  const formatDuration = (seconds?: number): string => {
    if (seconds === undefined || isNaN(seconds)) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const formatCallType = (type?: string): string => {
    if (!type) return "N/A";
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // e.g., web_call -> Web Call
  }

  return (
    <Collapsible open={isSelected} onOpenChange={onSelect} asChild>
      <div> {/* Outer div for Collapsible structure if needed, or apply to button */}
        <CollapsibleTrigger asChild>
          <button
            onClick={onSelect} // onOpenChange of Collapsible also calls this
            className={cn(
              "w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 outline-none",
              isSelected && "bg-blue-50 dark:bg-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/30"
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 text-sm flex-shrink-0">
                <AvatarFallback className={cn(isSelected ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-600")}>
                  {/* Using a generic call icon or agent initial if preferred */}
                  {agentName ? getInitial(agentName) : 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className={cn("font-medium text-sm truncate", isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-800 dark:text-gray-100")}>
                    {compactDisplayName}
                  </p>
                  <p className={cn("text-xs flex-shrink-0 ml-2", isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400")}>
                    {formattedTime}
                  </p>
                </div>
                <p className={cn("text-xs truncate", isSelected ? "text-blue-500 dark:text-blue-400/80" : "text-gray-500 dark:text-gray-400")}>
                  {/* Secondary info for compact view, e.g., date or duration */}
                  {formattedDateFull} - {formatDuration(call.duration)}
                </p>
              </div>
               <ChevronDown
                className={cn("h-4 w-4 text-gray-400 transition-transform duration-200", isSelected && "rotate-180")}
              />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3 pt-2 text-sm">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-sm space-y-3">
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Call Details</h4>
              <dl className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex justify-between"><dt>Agent:</dt><dd className="text-gray-800 dark:text-gray-100">{agentName || "N/A"}</dd></div>
                <div className="flex justify-between"><dt>Date:</dt><dd className="text-gray-800 dark:text-gray-100">{formattedDateFull}</dd></div>
                <div className="flex justify-between"><dt>Time:</dt><dd className="text-gray-800 dark:text-gray-100">{callStartTime}</dd></div>
                <div className="flex justify-between"><dt>Type:</dt><dd className="text-gray-800 dark:text-gray-100">{formatCallType(call.type)}</dd></div>
                <div className="flex justify-between"><dt>Duration:</dt><dd className="text-gray-800 dark:text-gray-100">{formatDuration(call.duration)}</dd></div>
              </dl>
            </div>
            {call.summary && (
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-1">Summary</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {call.summary}
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default CallLogListItem;
