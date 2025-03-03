
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
    <Sidebar className="border-r bg-[#f8f8f8]">
      <ProfileSection />
      <NavigationMenu />
      
      {/* Credit Usage Indicator with Upgrade Button */}
      <div className="mt-auto p-4 border-t">
        <div className="flex flex-col space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Minutes Used</span>
              <span className="text-xs font-medium text-muted-foreground">{creditUsage.used}/{creditUsage.total}</span>
            </div>
            <Progress value={creditUsage.percentage} className="h-1.5 bg-gray-200" indicatorClassName="bg-green-400" />
          </div>
          
          <div className="flex justify-center">
            <p className="text-sm text-gray-400 font-light">thoughtly</p>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
