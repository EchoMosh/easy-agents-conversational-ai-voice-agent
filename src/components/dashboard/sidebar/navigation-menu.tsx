
import { useEffect, useState } from "react";
import { 
  Users, 
  Target, 
  Settings, 
  GitMerge, 
  MessageSquare, 
  Book, 
  Zap,
  ChevronDown,
  ChevronUp, 
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  FileText,
  HelpCircle,
  Mail,
  FolderClosed,
  Grid
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";

// Create an icons object for easy lookup
const iconComponents = {
  Users,
  Target,
  Settings,
  GitMerge,
  MessageSquare,
  Book,
  Zap,
  ChevronDown,
  ChevronUp, 
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  FileText,
  HelpCircle,
  Mail,
  FolderClosed,
  Grid
};

// Updated menu items to match the reference design
export const mainMenuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/dashboard/overview",
    category: "Banking"
  },
  {
    title: "Calendar",
    icon: CalendarDays,
    url: "/dashboard/calendar",
    category: "Banking"
  },
  {
    title: "Analysis",
    icon: BarChart3,
    url: "/dashboard/analytics",
    category: "Banking"
  },
  {
    title: "Finances",
    icon: Zap,
    url: "/dashboard/automations",
    category: "Banking",
    highlight: true
  },
  {
    title: "Messages",
    icon: Mail,
    url: "/dashboard/chats",
    category: "Services",
    badge: 2
  },
  {
    title: "Documents",
    icon: FolderClosed,
    url: "/dashboard/knowledge",
    category: "Services"
  },
  {
    title: "Products",
    icon: Grid,
    url: "/dashboard/pipelines",
    category: "Services",
    highlight: true
  },
  {
    title: "Help",
    icon: HelpCircle,
    url: "/dashboard/help",
    category: "Other"
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/dashboard/settings",
    category: "Other"
  },
];

export function NavigationMenu() {
  const location = useLocation();
  const navigate = useNavigate();
  const { open } = useSidebar();
  const [displayedItems, setDisplayedItems] = useState(mainMenuItems);

  // Group menu items by category
  const groupedItems = displayedItems.reduce((acc, item) => {
    const category = item.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof mainMenuItems>);

  // Order categories
  const orderedCategories = ["Banking", "Services", "Other"];

  return (
    <SidebarContent className="px-2 w-full">
      {orderedCategories.map((category) => (
        groupedItems[category] && (
          <SidebarGroup key={category} className="mb-4">
            {open && (
              <div className="px-3 py-2 text-sm text-gray-500 font-normal">
                {category}
              </div>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {groupedItems[category].map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-3 rounded-xl transition-colors relative
                        ${isActive 
                          ? "bg-gray-100 text-gray-900 font-medium" 
                          : "text-gray-600 hover:bg-gray-50"}
                        ${item.highlight && !open ? "bg-black text-white" : ""}
                        ${item.highlight && open ? "bg-gray-100" : ""}
                      `}
                      title={item.title}
                    >
                      <div className={`
                        flex items-center justify-center 
                        ${item.highlight && !open ? "text-white" : "text-gray-500"}
                      `}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      
                      {open && (
                        <>
                          <span className="text-sm">{item.title}</span>
                          
                          {item.badge && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-red-500 text-white text-xs font-medium h-5 w-5 flex items-center justify-center rounded-full">
                              {item.badge}
                            </div>
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )
      ))}
    </SidebarContent>
  );
}
