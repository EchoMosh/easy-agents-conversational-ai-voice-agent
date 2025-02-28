
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/dashboard/app-sidebar";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
