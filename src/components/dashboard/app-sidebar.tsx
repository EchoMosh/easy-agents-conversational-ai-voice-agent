import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  Bot,
  FileText,
} from "lucide-react";
import { FloatingDock } from "@/components/ui/floating-dock"; // Adjusted import path
import { WorkspaceSwitcher } from "@/components/workspaces/workspace-switcher";

// Define app-specific menu items
const appMenuItems = [
  {
    title: "Leads",
    icon: <Users className="w-full h-full" />,
    href: "/dashboard/leads",
  },
  {
    title: "Agents",
    icon: <Bot className="w-full h-full" />,
    href: "/dashboard/agents",
  },
  {
    title: "Transcriptions",
    icon: <FileText className="w-full h-full" />,
    href: "/dashboard/transcriptions",
  },
  {
    title: "Knowledge Base",
    icon: <BookOpen className="w-full h-full" />,
    href: "/dashboard/knowledge",
  },
  {
    title: "Settings",
    icon: <Settings className="w-full h-full" />,
    href: "/dashboard/settings",
  },
];

export function AppSidebar() {
  return (
    <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50">
      {/* Workspace Switcher can be placed above or near the dock if needed */}
      {/* <div className="mb-4 flex justify-center">
        <WorkspaceSwitcher />
      </div> */}
      <FloatingDock items={appMenuItems} />
    </div>
  );
}
