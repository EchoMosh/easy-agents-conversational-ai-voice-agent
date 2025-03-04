
import { NavLink, useLocation } from "react-router-dom";
import { 
  Users, 
  Target, 
  Settings, 
  GitMerge, 
  MessageSquare, 
  Book, 
  Zap,
  LayoutDashboard,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import { mainMenuItems } from "./sidebar/navigation-menu";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar
} from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function DashboardSidebar() {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { setOpen } = useSidebar();
  const isAgentFlowPage = location.pathname.includes('/dashboard/agents/flow/');

  // Credit usage data (would come from API in a real app)
  const creditUsage = {
    used: 350,
    total: 1000,
    percentage: 35 // 350/1000 * 100
  };

  const toggleExpand = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title) 
        : [...prev, title]
    );
  };

  // Auto-expand parent menu when child is active
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

  // Close sidebar when on agent flow page
  useEffect(() => {
    setOpen(!isAgentFlowPage);
  }, [isAgentFlowPage, setOpen]);

  const isActive = (url: string) => {
    return location.pathname === url;
  };

  const isActiveOrHasActiveChild = (item: any) => {
    const isItemActive = location.pathname === item.url;
    const hasActiveChild = item.subItems?.some((subItem: any) => 
      location.pathname === subItem.url
    );
    return isItemActive || hasActiveChild;
  };

  return (
    <Sidebar className="border-r">
      {/* Profile Section */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src="https://github.com/shadcn.png" alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <p className="text-sm font-medium">Jane Doe</p>
          <p className="text-xs text-muted-foreground">Acme Corp</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.subItems && item.subItems.length > 0 ? (
                    <>
                      <SidebarMenuButton 
                        onClick={() => toggleExpand(item.title)}
                        isActive={isActiveOrHasActiveChild(item)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        <div className="ml-auto">
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
                                isActive={isActive(subItem.url)}
                              >
                                <NavLink to={subItem.url}>
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
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                    >
                      <NavLink to={item.url}>
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

      {/* Credit Usage and Upgrade Section */}
      <SidebarFooter>
        <div className="p-4 border-t">
          <div className="flex flex-col space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-muted-foreground">Credits</span>
                <span className="text-xs font-medium">{creditUsage.used}/{creditUsage.total}</span>
              </div>
              <Progress value={creditUsage.percentage} className="h-1.5 bg-secondary/50" />
            </div>
            
            <div>
              <p className="text-[10px] text-muted-foreground mb-2">
                Credits are used for AI generations and voice calls
              </p>
              <Button 
                size="sm" 
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-medium shadow-sm"
              >
                <Sparkles size={14} className="mr-1.5" />
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
