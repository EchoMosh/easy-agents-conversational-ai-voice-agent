
import {
  LayoutDashboard,
  MessagesSquare,
  UserSquare,
  Users,
  GitBranch,
  BookOpen,
  Settings,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

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
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

import { UserProfileSection } from "./sidebar/user-profile-section";
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
    icon: UserSquare,
    url: "/dashboard/agents",
  },
  {
    title: "Pipelines",
    icon: GitBranch,
    url: "/dashboard/pipelines",
  },
  {
    title: "Chats",
    icon: MessagesSquare,
    url: "/dashboard/chats",
  },
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
  const { state } = useSidebar();

  return (
    <Sidebar
      className="border-r bg-white text-black dark:bg-[#1e2235] dark:text-white narrow-sidebar"
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
                    isActive={location.pathname.startsWith(item.url)}
                    tooltip={state === "collapsed" ? item.title : undefined}
                  >
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `relative flex items-center ${
                          state !== "collapsed" ? "gap-3" : "justify-center"
                        } ${
                          isActive
                            ? "font-medium"
                            : "text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white"
                        }`
                      }
                    >
                      <div
                        className={`flex items-center justify-center ${
                          state === "collapsed" ? "w-full" : ""
                        }`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                      </div>
                      {state !== "collapsed" ? (
                        <span>{item.title}</span>
                      ) : (
                        <span className="sr-only">{item.title}</span>
                      )}
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
        <UserProfileSection />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
