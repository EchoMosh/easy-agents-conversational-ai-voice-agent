
import { Sidebar } from "@/components/ui/sidebar";
import { ProfileSection } from "./sidebar/profile-section";
import { NavigationMenu } from "./sidebar/navigation-menu";
import { useLocation } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import { useEffect } from "react";

export function AppSidebar() {
  const location = useLocation();
  const { setOpen } = useSidebar();
  const isAgentFlowPage = location.pathname.includes('/dashboard/agents/flow/');
  
  useEffect(() => {
    setOpen(!isAgentFlowPage);
  }, [location.pathname, isAgentFlowPage, setOpen]);

  return (
    <Sidebar>
      <ProfileSection />
      <NavigationMenu />
    </Sidebar>
  );
}
