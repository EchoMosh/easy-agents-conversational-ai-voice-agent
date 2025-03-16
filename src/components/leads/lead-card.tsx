
import { useDraggable } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/theme-provider";
import { Mail, Phone, MoveRight, Globe, User, Tag, Clock } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pipeline } from "@/types/pipeline";
import { format } from "date-fns";

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  pipelines?: Pipeline[];
  currentPipelineId?: string;
}

export function LeadCard({ lead, onClick, pipelines = [], currentPipelineId }: LeadCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMoving, setIsMoving] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        transition: 'transform 0ms',
        zIndex: 50,
      }
    : undefined;

  const handleMoveToPipeline = async (pipelineId: string) => {
    if (isMoving || pipelineId === lead.pipeline_id) return;
    
    setIsMoving(true);
    try {
      // Get the pipeline to find default status
      const targetPipeline = pipelines.find(p => p.id === pipelineId);
      const defaultStatus = targetPipeline?.columns[0]?.title || 'New';
      
      const { error } = await supabase
        .from('leads')
        .update({ 
          pipeline_id: pipelineId,
          status: defaultStatus
        })
        .eq('id', lead.id);
      
      if (error) throw error;
      
      // Optimistically update UI
      queryClient.invalidateQueries({
        queryKey: ['leads', currentPipelineId]
      });
      
      toast({
        title: "Lead moved",
        description: `Lead moved to ${targetPipeline?.name || 'new pipeline'}`
      });
    } catch (error) {
      console.error('Error moving lead:', error);
      toast({
        title: "Error moving lead",
        description: "There was a problem moving the lead",
        variant: "destructive"
      });
    } finally {
      setIsMoving(false);
    }
  };

  // Filter out current pipeline from options
  const otherPipelines = pipelines.filter(p => p.id !== currentPipelineId);

  // Determine the lead source (simplified version)
  const getLeadSource = () => {
    if (lead.source) {
      return lead.source;
    } else if (lead.email && lead.email.includes('@')) {
      const domain = lead.email.split('@')[1];
      return domain.split('.')[0];
    }
    return "direct";
  };
  
  // Format the creation date
  const formattedDate = lead.created_at 
    ? format(new Date(lead.created_at), 'MMM d')
    : '';

  // Get initials for avatar
  const getInitials = () => {
    if (!lead.name) return "??";
    return lead.name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className={cn(
            "cursor-grab active:cursor-grabbing transition-all",
            "rounded-md border border-gray-200 dark:border-gray-800",
            "hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md",
            isDragging && "opacity-90 shadow-lg rotate-1 scale-105",
            "overflow-hidden"
          )}
          onClick={onClick}
        >
          <CardContent className="p-0">
            {/* Top section with name and avatar */}
            <div className="flex items-center gap-3 p-3 pb-2">
              <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-full h-8 w-8 flex items-center justify-center text-xs font-medium text-white">
                {getInitials()}
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                  {lead.name}
                </h3>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex items-center">
                <Clock size={12} className="mr-1" />
                {formattedDate}
              </div>
            </div>
            
            {/* Contact info */}
            <div className="px-3 pb-2.5 flex flex-wrap gap-x-4 gap-y-1">
              {lead.email && (
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 truncate">
                  <Mail className="h-3 w-3 mr-1 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                  <span className="truncate max-w-[140px]">{lead.email}</span>
                </div>
              )}
              
              {lead.phone && (
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <Phone className="h-3 w-3 mr-1 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                  <span className="truncate max-w-[90px]">{lead.phone}</span>
                </div>
              )}
            </div>
            
            {/* Status footer */}
            <div className="bg-gray-50 dark:bg-gray-900/40 px-3 py-1.5 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <div className="flex items-center text-xs">
                <Tag size={12} className="mr-1.5 text-blue-500 dark:text-blue-400" />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {lead.status}
                </span>
              </div>
              <div className="flex items-center text-xs">
                <Globe size={12} className="mr-1.5 text-emerald-500 dark:text-emerald-400" />
                <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {getLeadSource()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {otherPipelines.length > 0 ? (
          <>
            <ContextMenuItem disabled className="text-xs text-muted-foreground font-medium">
              Move to pipeline
            </ContextMenuItem>
            {otherPipelines.map((pipeline) => (
              <ContextMenuItem
                key={pipeline.id}
                onClick={() => handleMoveToPipeline(pipeline.id)}
                disabled={isMoving}
                className="flex items-center gap-2"
              >
                <MoveRight className="h-3.5 w-3.5" />
                <span className="truncate">{pipeline.name}</span>
              </ContextMenuItem>
            ))}
          </>
        ) : (
          <ContextMenuItem disabled>
            No other pipelines available
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
