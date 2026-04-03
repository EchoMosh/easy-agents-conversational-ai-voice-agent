"use client";

import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
  SidebarInset,
  // SidebarTrigger, // Removed to hide the toggle icon
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { HeaderProfileSection } from "@/components/dashboard/header-profile-section";

export default function DashboardHeader() {
  const location = useLocation();

  // Function to get the page title based on the current path
  const getPageTitle = () => {
    const path = location.pathname;

    // Extract the last part of the path and format it
    const pathSegments = path.split("/").filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];

    if (!lastSegment) return "Dashboard";

    // Handle special cases or just capitalize the first letter
    switch (lastSegment) {
      case "agents":
        return "Agents";
      case "leads":
        return "Leads";
      case "pipelines":
        return "Pipelines";
      case "knowledge":
        return "Knowledge Base";
      case "settings":
        return "Settings";
      case "transcriptions":
        return "Transcriptions";
      case "phone-numbers":
        return "Phone Numbers";
      default:
        // For paths like agents/flow/:id, use the parent path
        if (pathSegments.length > 1) {
          const parentSegment = pathSegments[pathSegments.length - 2];
          // Special case for agent flow pages (URL format: /dashboard/agents/flow/:id)
          if (parentSegment === "agents" && pathSegments.length > 2) {
            const lastSegment = pathSegments[pathSegments.length - 1];

            // If this looks like a UUID or agent ID (over 8 chars), simply show "Agent Flow Editor"
            if (lastSegment && lastSegment.length > 8) {
              return "Agent Flow Editor";
            }
          }
          // Add more special cases here if needed
        }

        // Capitalize first letter and replace hyphens with spaces
        return lastSegment
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between px-4 border-b border-border/50 bg-background/60 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        {/* <SidebarTrigger className="-ml-1" /> // Removed to hide the toggle icon */}
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="text-lg font-semibold">{getPageTitle()}</div>
      </div>

      {/* User profile section in the top right */}
      <div className="flex items-center">
        <HeaderProfileSection />
      </div>
    </header>
  );
}
