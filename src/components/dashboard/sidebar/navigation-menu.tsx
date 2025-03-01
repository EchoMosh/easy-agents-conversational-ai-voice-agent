
import { useEffect, useState } from "react";
import { Users, Target, Settings, GitMerge, MessageSquare, Book, Zap } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
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
];

const bottomMenuItems = [
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

  // Load sidebar customization settings
  useEffect(() => {
    const loadSavedSettings = () => {
      const savedItems = localStorage.getItem('sidebar-settings');
      if (savedItems) {
        setCustomizedItems(JSON.parse(savedItems));
      }
    };

    // Initial load
    loadSavedSettings();

    // Listen for changes from the settings page
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

  // Apply customization when settings change
  useEffect(() => {
    if (customizedItems.length === 0) return;

    // Filter and reorder items based on customization
    const newDisplayedItems = [...mainMenuItems].map(menuItem => {
      const customItem = customizedItems.find(
        item => item.id === menuItem.title.toLowerCase()
      );
      
      if (customItem) {
        // Use custom icon if available
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
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {displayedItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarSeparator />

      <SidebarGroup className="mt-auto border-t pt-4">
        <SidebarGroupContent>
          <SidebarMenu>
            {bottomMenuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}
