
"use client";

import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function DashboardHeader() {
  const location = useLocation();
  
  // Function to get the page title based on the current path
  const getPageTitle = () => {
    const path = location.pathname;
    
    // Extract the last part of the path and format it
    const pathSegments = path.split('/').filter(Boolean);
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
      case "chats":
        return "Chats";
      case "knowledge":
        return "Knowledge Base";
      case "settings":
        return "Settings";
      case "lead-scraper":
        return "Lead Scraper";
      case "activities":
        return "Activities";
      case "overview":
        return "Dashboard";
      case "calendar":
        return "Calendar";
      case "automations":
        return "Automations";
      case "profile":
        return "Profile";
      default:
        // For paths like agents/flow/:id, use the parent path
        if (pathSegments.length > 1) {
          const parentSegment = pathSegments[pathSegments.length - 2];
          if (parentSegment === "agents" && lastSegment === "flow") {
            return "Agent Flow";
          }
          // Add more special cases here if needed
        }
        
        // Capitalize first letter and replace hyphens with spaces
        return lastSegment
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="text-lg font-semibold">{getPageTitle()}</div>
      </div>
    </header>
  );
}
