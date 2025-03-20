
import { useDraggable } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pipeline } from "@/types/pipeline";
import { Mail, Phone, MoveRight } from "lucide-react";

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  pipelines?: Pipeline[];
  currentPipelineId?: string;
  isPreview?: boolean;
}

export function LeadCard({ 
  lead, 
  onClick, 
  pipelines = [], 
  currentPipelineId,
  isPreview = false 
}: LeadCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMoving, setIsMoving] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    disabled: isPreview, // Disable dragging for preview leads
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        transition: 'transform 0ms',
        zIndex: 50,
      }
    : undefined;

  const handleMoveToPipeline = async (pipelineId: string) => {
    if (isMoving || pipelineId === lead.pipeline_id || isPreview) return;
    
    setIsMoving(true);
    try {
      // Get the pipeline to find default status
      const targetPipeline = pipelines.find(p => p.id === pipelineId);
      
      // Ensure we're working with unique columns for the target pipeline
      let defaultStatus = 'New';
      if (targetPipeline?.columns?.length > 0) {
        // Deduplicate columns before getting the first one
        const uniqueColumnsMap = new Map();
        targetPipeline.columns.forEach(col => uniqueColumnsMap.set(col.id, col));
        const uniqueColumns = Array.from(uniqueColumnsMap.values());
        
        // Use the first column's title as the default status
        if (uniqueColumns.length > 0) {
          defaultStatus = uniqueColumns[0].title;
        }
      }
      
      const { error } = await supabase
        .from('leads')
        .update({ 
          pipeline_id: pipelineId,
          status: defaultStatus,
          updated_at: new Date().toISOString() 
        })
        .eq('id', lead.id);
      
      if (error) throw error;
      
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['leads']
        }),
        queryClient.invalidateQueries({
          queryKey: ['pipelines']
        }),
        currentPipelineId && queryClient.invalidateQueries({
          queryKey: ['pipelines', currentPipelineId]
        }),
        pipelineId && queryClient.invalidateQueries({
          queryKey: ['pipelines', pipelineId]
        })
      ]);
      
      queryClient.refetchQueries({
        queryKey: ['leads']
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

  // For preview cards, render a simplified version
  if (isPreview) {
    return (
      <Card
        className={cn(
          "transition-all border border-blue-400 bg-blue-50/50 dark:bg-blue-900/20 shadow-md",
          "rounded-md"
        )}
      >
        <CardContent className="p-4 space-y-3">
          <h3 className="font-medium text-base">
            {lead.name || "Unnamed Lead"}
          </h3>
          
          {lead.email && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Mail className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
              <span>{lead.email}</span>
            </div>
          )}
          
          {lead.phone && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Phone className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
              <span>{lead.phone}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

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
            "hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm",
            isDragging && "opacity-90 shadow-lg rotate-1 scale-105"
          )}
          onClick={onClick}
        >
          <CardContent className="p-4 space-y-3">
            <h3 className="font-medium text-base">
              {lead.name || "Unnamed Lead"}
            </h3>
            
            {lead.email && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Mail className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                <span>{lead.email}</span>
              </div>
            )}
            
            {lead.phone && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Phone className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                <span>{lead.phone}</span>
              </div>
            )}
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
