"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { HeaderProfileSection } from "@/components/dashboard/header-profile-section";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Outlet, useLocation } from "react-router-dom";
import { useMemo } from "react";

// Map routes to their display names
const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/leads": "Leads",
  "/dashboard/agents": "Agents",
  "/dashboard/pipelines": "Pipelines",
  "/dashboard/chat": "Chat",
  "/dashboard/knowledge": "Knowledge Base",
  "/dashboard/settings": "Settings",
};

// Inner component that uses the sidebar context
function DashboardContent() {
  const location = useLocation();
  const { setOpen } = useSidebar();

  // Check if current route is the agent flow editor
  const isAgentFlowRoute = location.pathname.includes(
    "/dashboard/agents/flow/"
  );

  // Automatically collapse sidebar and disable scrolling when in agent flow editor
  useEffect(() => {
    if (isAgentFlowRoute) {
      setOpen(false);

      // Disable scrolling on body
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      return () => {
        // Re-enable scrolling when unmounting
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      };
    }
  }, [isAgentFlowRoute, setOpen]);

  // Determine the page title based on the current route
  const pageTitle = useMemo(() => {
    // Exact match
    if (routeTitles[location.pathname]) {
      return routeTitles[location.pathname];
    }

    // Check for partial matches (for subroutes)
    const matchingPath = Object.keys(routeTitles).find(
      (path) => location.pathname.startsWith(path) && path !== "/dashboard"
    );

    return matchingPath ? routeTitles[matchingPath] : "Dashboard";
  }, [location.pathname]);

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        {/* Hide header when in agent flow editor */}
        {!isAgentFlowRoute && (
          <header className="flex h-16 shrink-0 items-center justify-between border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="text-lg font-semibold">{pageTitle}</div>
            </div>
            {/* User profile section - always visible */}
            <HeaderProfileSection />
          </header>
        )}
        <div
          className={`flex flex-1 flex-col gap-4 p-4 pt-2 ${
            isAgentFlowRoute ? "overflow-hidden" : ""
          }`}
        >
          <Outlet />
        </div>
      </SidebarInset>
    </>
  );
}

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <SidebarProvider>
      <DashboardContent />
    </SidebarProvider>
  );
}
