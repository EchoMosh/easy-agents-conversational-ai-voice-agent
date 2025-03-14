
import { useRef } from 'react';
import { Panel } from '@xyflow/react';
import { Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { widgets, WidgetDefinition } from './widget-definitions';

interface WidgetPanelProps {
  showWidgets: boolean;
  setShowWidgets: (show: boolean) => void;
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

export function WidgetPanel({ showWidgets, setShowWidgets, onDragStart }: WidgetPanelProps) {
  const widgetButtonRef = useRef<HTMLButtonElement>(null);

  const toggleWidgetPanel = () => {
    setShowWidgets(prev => !prev);
  };

  return (
    <Panel position="bottom-left" className="space-y-2">
      <div className="relative">
        <button
          ref={widgetButtonRef}
          onClick={toggleWidgetPanel}
          className="p-2 rounded-full bg-primary text-primary-foreground shadow-lg transform transition-transform hover:scale-105 backdrop-blur-xl hover:bg-primary/90"
        >
          <Plus className={`h-5 w-5 transition-transform ${showWidgets ? 'rotate-45' : ''}`} />
        </button>
        {showWidgets && (
          <div 
            className="widget-panel absolute bottom-14 left-0 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 p-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] space-y-3 min-w-[180px] border border-white/20"
          >
            <TooltipProvider>
              {widgets.map((widget) => (
                <Tooltip key={widget.type}>
                  <TooltipTrigger asChild>
                    <div
                      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-move transition-all duration-200"
                      style={{
                        background: `color-mix(in srgb, ${widget.color} 10%, transparent)`,
                      }}
                      onDragStart={(e) => onDragStart(e, widget.type)}
                      draggable
                    >
                      <span 
                        className="p-1.5 rounded-lg"
                        style={{
                          background: `color-mix(in srgb, ${widget.color} 15%, transparent)`,
                          color: widget.color
                        }}
                      >
                        <widget.icon className="h-4 w-4" />
                      </span>
                      <span className="font-medium text-sm text-foreground/80">{widget.label}</span>
                      <kbd className="ml-auto px-1.5 py-0.5 bg-muted/50 rounded text-[10px] font-semibold text-muted-foreground">{widget.shortcut}</kbd>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="right"
                    className="bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]"
                  >
                    {widget.description}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        )}
      </div>
    </Panel>
  );
}
