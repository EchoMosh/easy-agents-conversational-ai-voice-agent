
import { ChevronDown, ChevronUp } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { MenuItem } from "./types";

interface MenuItemWithSubProps {
  item: MenuItem;
  isExpanded: boolean;
  isActive: boolean;
  onToggleExpand: (title: string) => void;
  onClick: (item: MenuItem, event: React.MouseEvent) => void;
  currentPath: string;
}

export function MenuItemWithSub({ 
  item, 
  isExpanded, 
  isActive, 
  onToggleExpand, 
  onClick,
  currentPath 
}: MenuItemWithSubProps) {
  return (
    <>
      <SidebarMenuButton 
        onClick={(e) => onClick(item, e)}
        isActive={isActive}
        className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-md transition-colors ${
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-foreground/70 hover:bg-muted hover:text-foreground"
        }`}
      >
        <div className="flex items-center gap-3">
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
        </div>
        <div className="chevron-toggle">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </SidebarMenuButton>
      
      {isExpanded && item.subItems && (
        <SidebarMenuSub>
          {item.subItems.map((subItem) => (
            <SidebarMenuSubItem key={subItem.title}>
              <SidebarMenuSubButton
                asChild
                isActive={currentPath === subItem.url}
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
  );
}
