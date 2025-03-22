
import { Suspense, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import LoadingScreen from "@/components/loading-screen";
import { useWorkspace } from "@/context/workspace-context";
import { ImportProvider } from "@/context/import-context";

function DashboardLayout() {
  const { isLoading } = useWorkspace();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ImportProvider>
      <div className="h-screen w-screen flex overflow-hidden bg-background relative">
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </main>
        <Toaster />
        <SonnerToaster position="bottom-right" />
      </div>
    </ImportProvider>
  );
}

export default DashboardLayout;
