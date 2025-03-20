
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityMonitor } from "../activity-monitor";
import { Lead } from "@/pages/dashboard/leads";
import { ActivityType } from "../types/activity-types";
import { useIsMobile } from "@/hooks/use-mobile";

interface ActivityMonitorDrawerProps {
  show: boolean;
  onClose: () => void;
  lead: Lead;
  activities: ActivityType[];
}

export function ActivityMonitorDrawer({ 
  show, 
  onClose, 
  lead, 
  activities 
}: ActivityMonitorDrawerProps) {
  const isMobile = useIsMobile();
  
  if (!show) return null;

  if (isMobile) {
    return (
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed inset-0 bg-background z-[9999]"
        style={{ maxWidth: "100vw" }}
      >
        <div className="flex items-center justify-between border-b p-2">
          <h3 className="text-sm font-medium">Activity & Insights</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-40px)]">
          <ActivityMonitor lead={lead} activities={activities} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ x: '100%', opacity: 0.5 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0.5 }}
      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      className="fixed inset-y-0 right-0 w-[320px] bg-background border-l shadow-lg z-[9999]"
      style={{ backdropFilter: "blur(4px)" }}
    >
      <div className="flex items-center justify-between border-b p-2">
        <h3 className="text-sm font-medium">Activity & Insights</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7" 
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="overflow-y-auto h-[calc(100%-40px)]">
        <ActivityMonitor lead={lead} activities={activities || []} />
      </div>
    </motion.div>
  );
}
