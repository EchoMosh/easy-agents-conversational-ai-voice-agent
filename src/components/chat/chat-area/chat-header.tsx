import { Lead } from "@/pages/dashboard/leads";
import { Button } from "@/components/ui/button";
import { BarChart2, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatHeaderProps {
  selectedLead: Lead;
  showActivityMonitor: boolean;
  setShowActivityMonitor: (show: boolean) => void;
  onBack?: () => void;
  activitiesCount?: number;
}

export function ChatHeader({
  selectedLead,
  showActivityMonitor,
  setShowActivityMonitor,
  onBack,
  activitiesCount = 0,
}: ChatHeaderProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="border-b p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
              {selectedLead.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {selectedLead.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                {selectedLead.email || selectedLead.phone || "No contact info"}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowActivityMonitor(!showActivityMonitor)}
          >
            <BarChart2
              className={cn("h-4 w-4", showActivityMonitor && "text-primary")}
            />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b p-3 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
            {selectedLead.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {selectedLead.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              {selectedLead.email || selectedLead.phone || "No contact info"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={showActivityMonitor ? "default" : "outline"}
            className="flex gap-1.5 items-center cursor-pointer"
            onClick={() => setShowActivityMonitor(!showActivityMonitor)}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>Activity</span>
            {activitiesCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-background text-[10px] text-foreground">
                {activitiesCount}
              </span>
            )}
          </Badge>
        </div>
      </div>
    </div>
  );
}
