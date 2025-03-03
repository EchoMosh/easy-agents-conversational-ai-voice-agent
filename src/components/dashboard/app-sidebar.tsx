
import { Sidebar } from "@/components/ui/sidebar";
import { ProfileSection } from "./sidebar/profile-section";
import { NavigationMenu } from "./sidebar/navigation-menu";
import { useLocation } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import { useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { GlowingEffect } from "@/components/ui/glowing-effect";
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
      
      {/* Stylish Easy Agents Text */}
      <div className="relative px-3 py-3 text-center border-t border-sidebar-border">
        <div className="relative">
          <GlowingEffect glow={true} blur={10} spread={30} disabled={false} />
          <div className="flex items-center justify-center gap-1.5">
            <Sparkles size={16} className="text-[#9b87f5]" />
            <span className="font-bold text-sm bg-gradient-to-r from-[#9b87f5] to-[#0EA5E9] bg-clip-text text-transparent">
              Easy Agents
            </span>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
