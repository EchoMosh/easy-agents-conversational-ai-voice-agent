
import { Outlet, useLocation } from "react-router-dom";
import { DockNavigation } from "@/components/dashboard/dock-navigation";

export default function DashboardLayout() {
  const location = useLocation();
  const isAgentFlowPage = location.pathname.includes('/dashboard/agents/flow/');

  return (
    <div className="min-h-screen w-full bg-background">
      <main className={`w-full min-h-screen pb-20 ${isAgentFlowPage ? 'p-0' : 'p-6'}`}>
        <Outlet />
      </main>
      <DockNavigation />
    </div>
  );
}
