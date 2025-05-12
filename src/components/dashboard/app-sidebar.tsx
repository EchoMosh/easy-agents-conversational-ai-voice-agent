import {
  LayoutDashboard,
  MessagesSquare,
  UserSquare,
  Users,
  GitBranch,
  BookOpen,
  Settings,
  Bot,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

import { WorkspaceSwitcher } from "@/components/workspaces/workspace-switcher";

// Define app-specific menu items
const appMenuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/dashboard",
  },
  {
    title: "Leads",
    icon: Users,
    url: "/dashboard/leads",
  },
  {
    title: "Agents",
    icon: Bot,
    url: "/dashboard/agents",
  },
  // Pipelines feature hidden
  // {
  //   title: "Pipelines",
  //   icon: GitBranch,
  //   url: "/dashboard/pipelines",
  // },
  // Chat feature hidden
  // {
  //   title: "Chats",
  //   icon: MessagesSquare,
  //   url: "/dashboard/chats",
  // },
  {
    title: "Knowledge Base",
    icon: BookOpen,
    url: "/dashboard/knowledge",
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/dashboard/settings",
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { setOpen } = useSidebar();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Initialize sidebar in collapsed state with no hover behavior
  useEffect(() => {
    // Start with sidebar collapsed and keep it that way
    setOpen(false);
    console.log("Sidebar initialized as collapsed with no hover expansion");

    // No hover behavior - sidebar will only change state via explicit user action
  }, [setOpen]);

  return (
    <Sidebar
      ref={sidebarRef}
      className="border-r bg-white text-black dark:bg-[#1e2235] dark:text-white transition-all duration-300 ease-in-out"
      collapsible="icon"
    >
      <SidebarHeader className="p-0">
        {/* Workspace Switcher */}
        <div className="p-3">
          <WorkspaceSwitcher />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Application Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {appMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.url === "/dashboard"
                        ? location.pathname === "/dashboard" ||
                          location.pathname === "/dashboard/"
                        : location.pathname.startsWith(item.url)
                    }
                    tooltip={item.title}
                    className="group-data-[collapsible=icon]:justify-center"
                  >
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `relative flex items-center gap-3 ${
                          isActive
                            ? "font-medium"
                            : "text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator className="mb-2 mt-0 bg-gray-700/50" />
        {/* UserProfileSection has been removed from here */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
