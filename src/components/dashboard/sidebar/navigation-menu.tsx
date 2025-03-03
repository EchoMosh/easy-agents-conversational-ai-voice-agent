import { useEffect, useState } from "react";
import { 
  Users, 
  Target, 
  GitMerge, 
  MessageSquare, 
  Book, 
  Zap,
  Settings,
  LayoutDashboard,
  Phone
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
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
  LayoutDashboard,
  Phone
};

export const mainMenuItems = [
  {
    title: "Agents",
    icon: Users,
    url: "/dashboard/agents",
    subItems: [
      {
        title: "Knowledge",
        url: "/dashboard/knowledge",
        icon: Book,
      }
    ]
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
  subItems?: CustomizedMenuItem[];
}

// Helper function to render section label
const SectionLabel = ({ label }: { label: string }) => (
  <div className="px-4 py-2">
    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">{label}</span>
  </div>
);

export function NavigationMenu() {
  const location = useLocation();
  const navigate = useNavigate();
  const [customizedItems, setCustomizedItems] = useState<CustomizedMenuItem[]>([]);
  const [displayedItems, setDisplayedItems] = useState(mainMenuItems);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Toggle submenu expansion
  const toggleExpand = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title) 
        : [...prev, title]
    );
  };

  // Handle item click - navigate and toggle submenu if it has subitems
  const handleItemClick = (item: any, event: React.MouseEvent) => {
    if (item.subItems && item.subItems.length > 0) {
      // If clicking on the icon or text area (not on the chevron), navigate to the URL
      const target = event.target as HTMLElement;
      const isChevronClick = target.closest('.chevron-toggle');
      
      if (!isChevronClick) {
        navigate(item.url);
      }
      
      // Toggle the submenu regardless
      toggleExpand(item.title);
    } else {
      // For items without subitems, just navigate
      navigate(item.url);
    }
  };

  // Check if a menu item is active or has an active child
  const isActiveOrHasActiveChild = (item: any) => {
    const isActive = location.pathname === item.url;
    const hasActiveChild = item.subItems?.some((subItem: any) => 
      location.pathname === subItem.url
    );
    return isActive || hasActiveChild;
  };

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

  // Auto-expand menu items that have active children
  useEffect(() => {
    const pathsToExpand = mainMenuItems
      .filter(item => item.subItems?.some(subItem => location.pathname === subItem.url))
      .map(item => item.title);
    
    if (pathsToExpand.length > 0) {
      setExpandedItems(prev => {
        const newExpanded = [...prev];
        pathsToExpand.forEach(path => {
          if (!newExpanded.includes(path)) {
            newExpanded.push(path);
          }
        });
        return newExpanded;
      });
    }
  }, [location.pathname]);

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
        
        // Map subItems if they exist
        const mappedSubItems = menuItem.subItems?.map(subItem => {
          const customSubItem = customItem.subItems?.find(
            item => item.id === subItem.title.toLowerCase()
          );

          return {
            ...subItem,
            visible: customSubItem ? customSubItem.visible : true
          };
        }).filter(subItem => subItem.visible);
          
        return {
          ...menuItem,
          icon: IconComponent,
          visible: customItem.visible,
          subItems: mappedSubItems
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

  // Group items by their position in the sidebar
  const topItems = displayedItems.slice(0, 2);
  const middleItems = displayedItems.slice(2, 4);
  const bottomItems = displayedItems.slice(4);

  return (
    <SidebarContent className="py-2">
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {/* First section */}
            <SectionLabel label="Create" />
            {topItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  onClick={(e) => handleItemClick(item, e)}
                  isActive={isActiveOrHasActiveChild(item)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-md mx-2 transition-colors text-gray-600 ${
                    isActiveOrHasActiveChild(item)
                      ? "bg-[#e6f7e6] text-green-600 font-medium"
                      : "hover:bg-gray-100"
                  }`}
                  tooltip={item.title}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-4 w-4 ${isActiveOrHasActiveChild(item) ? "text-green-500" : "text-gray-400"}`} />
                    <span className="text-sm">{item.title}</span>
                  </div>
                </SidebarMenuButton>
                
                {expandedItems.includes(item.title) && item.subItems && (
                  <SidebarMenuSub>
                    {item.subItems.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location.pathname === subItem.url}
                        >
                          <NavLink
                            to={subItem.url}
                            className={({ isActive }) =>
                              `flex items-center gap-3 ${
                                isActive
                                  ? "text-green-600 font-medium"
                                  : "text-gray-600 hover:text-gray-900"
                              }`
                            }
                          >
                            <subItem.icon className={`h-4 w-4 ${
                              location.pathname === subItem.url ? "text-green-500" : "text-gray-400"
                            }`} />
                            <span className="text-sm">{subItem.title}</span>
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            ))}

            {/* Second section */}
            <SectionLabel label="Connect" />
            {middleItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild
                  tooltip={item.title}
                >
                  <NavLink
                    to={item.url}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2 rounded-md mx-2 transition-colors text-gray-600 ${
                        isActive
                          ? "bg-[#e6f7e6] text-green-600 font-medium"
                          : "hover:bg-gray-100"
                      }`
                    }
                  >
                    <item.icon className={`h-4 w-4 ${location.pathname === item.url ? "text-green-500" : "text-gray-400"}`} />
                    <span className="text-sm">{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            {/* Third section */}
            <SectionLabel label="Deploy" />
            {bottomItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild
                  tooltip={item.title}
                >
                  <NavLink
                    to={item.url}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2 rounded-md mx-2 transition-colors text-gray-600 ${
                        isActive
                          ? "bg-[#e6f7e6] text-green-600 font-medium"
                          : "hover:bg-gray-100"
                      }`
                    }
                  >
                    <item.icon className={`h-4 w-4 ${location.pathname === item.url ? "text-green-500" : "text-gray-400"}`} />
                    <span className="text-sm">{item.title}</span>
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
