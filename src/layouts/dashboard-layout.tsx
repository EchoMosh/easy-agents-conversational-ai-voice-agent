
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout() {
  const location = useLocation();
  const isAgentFlowPage = location.pathname.includes('/dashboard/agents/flow/');

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <main className={`flex-1 overflow-hidden w-full ${isAgentFlowPage ? 'pl-0 pr-0 pt-0 pb-0' : 'p-6'}`}>
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
