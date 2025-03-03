
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
  ChevronLeft, 
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

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
  ChevronLeft, 
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
};

export const mainMenuItems = [
  {
    title: "Agents",
    icon: Users,
    url: "/dashboard/agents",
  },
  {
    title: "Leads",
    icon: Target,
    url: "/dashboard/leads",
  },
  {
    title: "Pipelines",
    icon: GitMerge,
    url: "/dashboard/pipelines",
  },
  {
    title: "Chats",
    icon: MessageSquare,
    url: "/dashboard/chats",
  },
  {
    title: "Knowledge",
    icon: Book,
    url: "/dashboard/knowledge",
  },
  {
    title: "Automations",
    icon: Zap,
    url: "/dashboard/automations",
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/dashboard/settings",
  },
];

interface CustomizedMenuItem {
  id: string;
  title: string;
  visible: boolean;
  icon?: string;
}

export function NavigationMenu() {
  const [customizedItems, setCustomizedItems] = useState<CustomizedMenuItem[]>([]);
  const [displayedItems, setDisplayedItems] = useState(mainMenuItems);
  const location = useLocation();

  useEffect(() => {
    const loadSavedSettings = () => {
      const savedItems = localStorage.getItem('sidebar-settings');
      if (savedItems) {
        setCustomizedItems(JSON.parse(savedItems));
      }
    };

    loadSavedSettings();

    const handleSettingsChanged = (event: any) => {
      if (event.detail && event.detail.items) {
        setCustomizedItems(event.detail.items);
      }
    };

    window.addEventListener('sidebar-settings-changed', handleSettingsChanged);
    
    return () => {
      window.removeEventListener('sidebar-settings-changed', handleSettingsChanged);
    };
  }, []);

  useEffect(() => {
    if (customizedItems.length === 0) return;

    const newDisplayedItems = [...mainMenuItems].map(menuItem => {
      const customItem = customizedItems.find(
        item => item.id === menuItem.title.toLowerCase()
      );
      
      if (customItem) {
        const IconComponent = customItem.icon && iconComponents[customItem.icon as keyof typeof iconComponents] 
          ? iconComponents[customItem.icon as keyof typeof iconComponents] 
          : menuItem.icon;
          
        return {
          ...menuItem,
          icon: IconComponent,
          visible: customItem.visible
        };
      }
      
      return menuItem;
    }).filter(item => {
      const customItem = customizedItems.find(
        custom => custom.id === item.title.toLowerCase()
      );
      return customItem ? customItem.visible : true;
    }).sort((a, b) => {
      const aIndex = customizedItems.findIndex(item => item.id === a.title.toLowerCase());
      const bIndex = customizedItems.findIndex(item => item.id === b.title.toLowerCase());
      return aIndex - bIndex;
    });

    setDisplayedItems(newDisplayedItems);
  }, [customizedItems]);

  return (
    <SidebarContent className="py-3 px-2">
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {displayedItems.map((item, index) => {
              const isActive = location.pathname.startsWith(item.url);
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-300 hover:translate-x-0.5 ${
                          isActive
                            ? "bg-gradient-to-r from-indigo-500/20 to-purple-600/20 text-indigo-400 font-medium shadow-sm backdrop-blur-sm"
                            : "text-foreground/80 hover:bg-white/5 hover:text-foreground/90"
                        }`
                      }
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animation: "fade-in 0.4s ease-out"
                      }}
                    >
                      <item.icon 
                        className={`h-4.5 w-4.5 transition-all duration-300 ${
                          isActive 
                            ? "text-indigo-400" 
                            : "text-muted-foreground"
                        }`} 
                      />
                      <span className="font-medium text-sm tracking-wide">{item.title}</span>
                      
                      {isActive && (
                        <div 
                          className="absolute left-0 w-1 h-4 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-r-full animate-pulse"
                          style={{
                            animation: "fade-in 0.3s ease-out, pulse 2s infinite" 
                          }}
                        />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}
