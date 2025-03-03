
import { NavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { 
  HomeIcon, 
  CloudIcon, 
  MessageSquareIcon, 
  ArchiveIcon,
  BellIcon,
  SettingsIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavigationMenuItem } from "./navigation-menu";

// Define the navigation item type
interface NavItem {
  icon: typeof HomeIcon;
  path: string;
  label: string;
}

export function SidebarNav() {
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      icon: HomeIcon,
      path: "/dashboard/overview",
      label: "Home"
    },
    {
      icon: CloudIcon,
      path: "/dashboard/calendar",
      label: "Calendar"
    },
    {
      icon: MessageSquareIcon,
      path: "/dashboard/chats",
      label: "Chats"
    },
    {
      icon: ArchiveIcon,
      path: "/dashboard/knowledge",
      label: "Files"
    },
    {
      icon: BellIcon,
      path: "/dashboard/notifications",
      label: "Notifications"
    },
    {
      icon: SettingsIcon,
      path: "/dashboard/settings",
      label: "Settings"
    }
  ];

  return (
    <nav className="flex flex-col items-center gap-7 w-full">
      {navItems.map((item) => (
        <NavLink 
          key={item.path} 
          to={item.path}
          title={item.label}
          className={({ isActive }) => cn(
            "relative flex justify-center items-center w-10 h-10 rounded-full transition-all",
            isActive 
              ? "bg-black text-white shadow-md" 
              : "text-gray-500 hover:bg-gray-200/60"
          )}
        >
          <item.icon size={20} />
        </NavLink>
      ))}
    </nav>
  );
}
