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
  lightMode?: boolean;
}

export function MenuItemWithSub({
  item,
  isExpanded,
  isActive,
  onToggleExpand,
  onClick,
  currentPath,
  lightMode = false,
}: MenuItemWithSubProps) {
  return (
    <>
      <SidebarMenuButton
        onClick={(e) => onClick(item, e)}
        isActive={isActive}
        className={`relative flex items-center justify-between gap-3 px-4 py-2.5 rounded-md transition-all group ${
          isActive
            ? lightMode
              ? "text-[#1e2235] font-medium"
              : "text-white font-medium"
            : lightMode
            ? "text-[#1e2235]/70 hover:text-[#1e2235]"
            : "text-white/80 hover:text-white"
        }`}
      >
        <div className="flex items-center gap-3">
          {isActive && (
            <span
              className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 rounded-r-full ${
                lightMode ? "bg-[#1e2235]" : "bg-white"
              }`}
            />
          )}
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-md ${
              isActive
                ? lightMode
                  ? "text-[#1e2235]"
                  : "text-white"
                : lightMode
                ? "text-[#1e2235]/70"
                : "text-white/80"
            } transition-colors`}
          >
            <item.icon className="h-5 w-5" />
          </div>
          <span>{item.title}</span>
        </div>
        <div
          className={`chevron-toggle rounded-full p-1 transition-colors ${
            lightMode
              ? "hover:bg-gray-200/80 text-[#1e2235]/60"
              : "hover:bg-gray-700/50 text-white/80"
          }`}
        >
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </div>
      </SidebarMenuButton>

      {isExpanded && item.subItems && (
        <SidebarMenuSub
          className={`ml-4 pl-6 border-l ${
            lightMode ? "border-gray-200" : "border-gray-700/50"
          }`}
        >
          {item.subItems.map((subItem) => {
            const isSubActive = currentPath === subItem.url;
            return (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton asChild isActive={isSubActive}>
                  <NavLink
                    to={subItem.url}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 py-2 group transition-colors ${
                        isActive
                          ? lightMode
                            ? "text-[#1e2235] font-medium"
                            : "text-white font-medium"
                          : lightMode
                          ? "text-[#1e2235]/70 hover:text-[#1e2235]"
                          : "text-white/70 hover:text-white"
                      }`
                    }
                  >
                    <div
                      className={`flex items-center justify-center w-6 h-6 rounded-md ${
                        isSubActive
                          ? lightMode
                            ? "text-[#1e2235]"
                            : "text-white"
                          : lightMode
                          ? "text-[#1e2235]/70 group-hover:text-[#1e2235]"
                          : "text-white/70 group-hover:text-white"
                      } transition-colors`}
                    >
                      <subItem.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm">{subItem.title}</span>
                  </NavLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      )}
    </>
  );
}
