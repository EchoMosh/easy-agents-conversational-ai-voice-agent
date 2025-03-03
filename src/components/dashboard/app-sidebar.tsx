
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/dashboard/sidebar/sidebar-nav";
import { SidebarProfile } from "@/components/dashboard/sidebar/sidebar-profile";
import { SidebarLogo } from "@/components/dashboard/sidebar/sidebar-logo";

export function AppSidebar() {
  const location = useLocation();
  const { setOpen } = useSidebar();
  const isAgentFlowPage = location.pathname.includes('/dashboard/agents/flow/');
  
  useEffect(() => {
    setOpen(!isAgentFlowPage);
  }, [location.pathname, isAgentFlowPage, setOpen]);

  return (
    <Sidebar className="border-0 shadow-none bg-white p-0 w-[80px] flex flex-col items-center">
      <div className="flex flex-col items-center justify-between h-full py-6 w-full">
        <div className="flex flex-col items-center gap-8 w-full">
          <SidebarLogo />
          <SidebarNav />
        </div>
        <SidebarProfile />
      </div>
    </Sidebar>
  );
}
