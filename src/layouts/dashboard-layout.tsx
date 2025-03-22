
import { Suspense, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import LoadingScreen from "@/components/loading-screen";
import { useWorkspace } from "@/context/workspace-context";
import { ImportProvider } from "@/context/import-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardHeader from "@/components/dashboard/page";

function DashboardLayout() {
  const { isLoading } = useWorkspace();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ImportProvider>
      <SidebarProvider>
        <div className="h-screen w-screen flex overflow-hidden bg-background relative">
          <AppSidebar />
          <main className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader />
            <div className="flex-1 overflow-auto">
              <Suspense fallback={<LoadingScreen />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
          <Toaster />
          <SonnerToaster position="bottom-right" />
        </div>
      </SidebarProvider>
    </ImportProvider>
  );
}

export default DashboardLayout;
