
import { Sidebar } from "@/components/ui/sidebar";
import { ProfileSection } from "./sidebar/profile-section";
import { NavigationMenu } from "./sidebar/navigation-menu";
import { useLocation } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import { useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function AppSidebar() {
  const location = useLocation();
  const { setOpen } = useSidebar();
  const isAgentFlowPage = location.pathname.includes('/dashboard/agents/flow/');
  
  // This would typically come from an API or state management
  const creditUsage = {
    used: 350,
    total: 1000,
    percentage: 35 // 350/1000 * 100
  };
  
  useEffect(() => {
    setOpen(!isAgentFlowPage);
  }, [location.pathname, isAgentFlowPage, setOpen]);

  return (
    <Sidebar className="border-r border-border/30 bg-background/95 backdrop-blur-sm">
      <ProfileSection />
      <NavigationMenu />
      
      {/* Credit Usage Indicator with Upgrade Button */}
      <div className="mt-auto p-5 border-t border-border/30">
        <div className="flex flex-col space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-xs font-medium text-muted-foreground">Credits</span>
              <span className="text-xs font-semibold">{creditUsage.used}/{creditUsage.total}</span>
            </div>
            <Progress 
              value={creditUsage.percentage} 
              className="h-1.5 bg-secondary/50 rounded-full overflow-hidden" 
              indicatorClassName="bg-gradient-to-r from-indigo-500 to-purple-500"
            />
          </div>
          
          <div>
            <p className="text-[11px] text-muted-foreground mb-3 font-light">
              Credits are used for AI generations and voice calls
            </p>
            <Button 
              size="sm" 
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-700 text-white font-medium shadow-md transition-all duration-300 rounded-md border border-white/5"
            >
              <Sparkles size={14} className="mr-1.5" />
              Upgrade Plan
            </Button>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
