
import { Sidebar } from "@/components/ui/sidebar";
import { ProfileSection } from "./sidebar/profile-section";
import { NavigationMenu } from "./sidebar/navigation-menu";
import { useLocation } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import { useEffect } from "react";
import { Progress } from "@/components/ui/progress";

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
      
      {/* Credit Usage Indicator */}
      <div className="mt-auto px-3 py-2">
        <div className="flex justify-between items-center mb-1 text-xs">
          <span className="text-muted-foreground">Credits Used</span>
          <span className="font-medium">{creditUsage.used}/{creditUsage.total}</span>
        </div>
        <Progress value={creditUsage.percentage} className="h-1" />
        <p className="text-[10px] text-muted-foreground mt-1">
          Credits are used for AI generations and voice calls
        </p>
      </div>
    </Sidebar>
  );
}
