import { NavLink } from "react-router-dom";
import { SidebarMenuButton, SidebarMenuBadge } from "@/components/ui/sidebar";
import type { MenuItem as MenuItemType } from "./types";

interface MenuItemProps {
  item: MenuItemType;
  lightMode?: boolean;
}

export function MenuItem({ item, lightMode = false }: MenuItemProps) {
  return (
    <SidebarMenuButton asChild>
      <NavLink
        to={item.url}
        className={({ isActive }) =>
          `relative flex items-center gap-3 px-4 py-2.5 rounded-md transition-all group ${
            item.highlight
              ? "bg-white text-[#1e2235] font-medium"
              : isActive
              ? "text-white font-medium"
              : "text-white/80 hover:text-white"
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && !item.highlight && (
              <span
                className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 rounded-r-full ${
                  lightMode ? "bg-[#1e2235]" : "bg-white"
                }`}
              />
            )}
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-md ${
                item.highlight
                  ? "text-[#1e2235]"
                  : isActive
                  ? "text-white"
                  : "text-white/80"
              } transition-colors`}
            >
              <item.icon className="h-5 w-5" />
            </div>
            <span>{item.title}</span>

            {item.badge && (
              <div className="ml-auto bg-blue-400 rounded-md px-2 py-0.5 text-xs font-medium text-white">
                {item.badge}
              </div>
            )}
          </>
        )}
      </NavLink>
    </SidebarMenuButton>
  );
}
