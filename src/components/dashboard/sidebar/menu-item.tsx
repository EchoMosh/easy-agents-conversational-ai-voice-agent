
import { NavLink } from "react-router-dom";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import type { MenuItem as MenuItemType } from "./types";

interface MenuItemProps {
  item: MenuItemType;
}

export function MenuItem({ item }: MenuItemProps) {
  return (
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
  );
}
