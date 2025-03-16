
import { useDraggable } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/theme-provider";
import { Mail, Phone, MoveRight, Globe } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pipeline } from "@/types/pipeline";

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  pipelines?: Pipeline[];
  currentPipelineId?: string;
}

export function LeadCard({ lead, onClick, pipelines = [], currentPipelineId }: LeadCardProps) {
  const { theme } = useTheme();
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

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className={cn(
            "cursor-grab active:cursor-grabbing transition-all hover:shadow-md",
            "rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
            "hover:border-gray-300 dark:hover:border-gray-600",
            isDragging && "opacity-70 shadow-lg"
          )}
          onClick={onClick}
        >
          <CardContent className="p-3.5">
            <div className="flex flex-col space-y-2.5">
              <div className={cn(
                "font-semibold text-base",
                theme === "light" ? "text-gray-900" : "text-gray-100"
              )}>
                {lead.name}
              </div>
              
              {lead.email && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <Mail className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="truncate">{lead.email}</span>
                </div>
              )}
              
              {lead.phone && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <Phone className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="truncate">{lead.phone}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 mt-1 pt-1.5 border-t border-gray-100 dark:border-gray-700">
                <Globe className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span className="truncate font-medium">{getLeadSource()}</span>
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
