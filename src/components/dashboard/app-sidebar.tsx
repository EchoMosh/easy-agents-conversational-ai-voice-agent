
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
    <Sidebar>
      <ProfileSection />
      <NavigationMenu />
      
      {/* Credit Usage Indicator with Upgrade Button */}
      <div className="mt-auto px-3 py-2 border-t border-sidebar-border">
        <div className="flex justify-between items-center mb-1 text-xs">
          <span className="text-muted-foreground">Credits Used</span>
          <span className="font-medium">{creditUsage.used}/{creditUsage.total}</span>
        </div>
        <Progress value={creditUsage.percentage} className="h-1" />
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-[10px] text-muted-foreground">
            Credits are used for AI generations and voice calls
          </p>
          <Button 
            size="sm" 
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
          >
            <Sparkles size={14} className="mr-1" />
            Upgrade Plan
          </Button>
        </div>
      </div>
    </Sidebar>
  );
}
