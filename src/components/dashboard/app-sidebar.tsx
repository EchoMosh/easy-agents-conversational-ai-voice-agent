
import {
  LayoutDashboard,
  MessagesSquare,
  UserSquare,
  Users,
  GitBranch,
  FileText,
  BookOpen,
  Settings,
  Code,
  History,
  Star,
  ChevronsUpDown,
  Building2,
  TrendingUp,
  CircleEllipsis,
  Plus,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";

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
import { TeamSwitcher } from "@/components/team-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";

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
  const [showTeamsDropdown, setShowTeamsDropdown] = useState(false);

  // Mock teams data
  const teams = [
    { id: "1", name: "Acme Inc", icon: Building2 },
    { id: "2", name: "Acme Corp.", icon: TrendingUp },
    { id: "3", name: "Evil Corp.", icon: CircleEllipsis },
  ];

  return (
    <Sidebar
      className="border-r bg-white text-black dark:bg-[#1e2235] dark:text-white narrow-sidebar"
      collapsible="icon"
    >
      <SidebarHeader className="p-0">
        {/* Workspace Switcher */}
        <div className="p-3">
          <DropdownMenu
            open={showTeamsDropdown}
            onOpenChange={setShowTeamsDropdown}
          >
            <DropdownMenuTrigger asChild>
              <button
                className={`flex w-full items-center ${
                  state !== "collapsed" ? "gap-2" : "justify-center"
                } rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800`}
              >
                <div
                  className={`flex shrink-0 items-center justify-center rounded-md bg-black text-white ${
                    state !== "collapsed" ? "h-10 w-10" : "h-10 w-10 mx-auto"
                  }`}
                >
                  <Building2 className="h-5 w-5" />
                </div>
                {state !== "collapsed" && (
                  <>
                    <div className="flex-1 text-left">
                      <div className="text-base font-medium">Acme Inc</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Enterprise
                      </div>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-gray-500" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[280px]">
              <DropdownMenuLabel>Teams</DropdownMenuLabel>

              {teams.map((team, index) => (
                <DropdownMenuItem
                  key={team.id}
                  className="flex items-center gap-2 py-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border">
                    <team.icon className="h-4 w-4" />
                  </div>
                  <span>{team.name}</span>
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-gray-500">Add team</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
