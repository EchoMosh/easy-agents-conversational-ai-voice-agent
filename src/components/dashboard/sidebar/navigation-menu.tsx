
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
  ArrowRight,
  LayoutDashboard,
  CalendarDays,
  Scan
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
  ChevronDown,
  ChevronUp, 
  ChevronLeft, 
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  LayoutDashboard,
  CalendarDays,
  Scan
};

export const mainMenuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/dashboard/overview",
  },
  {
    title: "Calendar",
    icon: CalendarDays,
    url: "/dashboard/calendar",
  },
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
    title: "Lead Scraper",
    icon: Scan,
    url: "/dashboard/lead-scraper",
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

export function NavigationMenu() {
  const location = useLocation();
  const navigate = useNavigate();
  const [customizedItems, setCustomizedItems] = useState<CustomizedMenuItem[]>([]);
  const [displayedItems, setDisplayedItems] = useState(mainMenuItems);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title) 
        : [...prev, title]
    );
  };

  const handleItemClick = (item: any, event: React.MouseEvent) => {
    if (item.subItems && item.subItems.length > 0) {
      const target = event.target as HTMLElement;
      const isChevronClick = target.closest('.chevron-toggle');
      
      if (!isChevronClick) {
        navigate(item.url);
      }
      
      toggleExpand(item.title);
    } else {
      navigate(item.url);
    }
  };

  const isActiveOrHasActiveChild = (item: any) => {
    const isActive = location.pathname === item.url;
    const hasActiveChild = item.subItems?.some((subItem: any) => 
      location.pathname === subItem.url
    );
    return isActive || hasActiveChild;
  };

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

  return (
    <SidebarContent className="py-2">
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {displayedItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                {item.subItems && item.subItems.length > 0 ? (
                  <>
                    <SidebarMenuButton 
                      onClick={(e) => handleItemClick(item, e)}
                      isActive={isActiveOrHasActiveChild(item)}
                      className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-md transition-colors ${
                        isActiveOrHasActiveChild(item)
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground/70 hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                      <div className="chevron-toggle">
                        {expandedItems.includes(item.title) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </SidebarMenuButton>
                    
                    {expandedItems.includes(item.title) && (
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
                                      ? "text-primary font-medium"
                                      : "text-foreground/70 hover:text-foreground"
                                  }`
                                }
                              >
                                <subItem.icon className="h-4 w-4" />
                                <span>{subItem.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </>
                ) : (
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground/70 hover:bg-muted hover:text-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}
