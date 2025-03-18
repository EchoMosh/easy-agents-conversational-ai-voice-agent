import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { MenuItem as MenuItemComponent } from "./menu-item";
import { MenuItemWithSub } from "./menu-item-with-sub";
import { useCustomMenu } from "./use-custom-menu";
import { MenuItem } from "./types";
import { historyMenuItems, mainMenuItems } from "./menu-items";

interface NavigationMenuProps {
  isHistory?: boolean;
  lightMode?: boolean;
}

export function NavigationMenu({
  isHistory = false,
  lightMode = false,
}: NavigationMenuProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { displayedItems } = useCustomMenu();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Select which items to display based on isHistory prop - directly use the imported items
  const items = isHistory ? historyMenuItems : mainMenuItems;

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const handleItemClick = (item: MenuItem, event: React.MouseEvent) => {
    if (item.subItems && item.subItems.length > 0) {
      const target = event.target as HTMLElement;
      const isChevronClick = target.closest(".chevron-toggle");

      if (!isChevronClick) {
        navigate(item.url);
      }

      toggleExpand(item.title);
    } else {
      navigate(item.url);
    }
  };

  const isActiveOrHasActiveChild = (item: MenuItem) => {
    const isActive = location.pathname === item.url;
    const hasActiveChild = item.subItems?.some(
      (subItem) => location.pathname === subItem.url
    );
    return isActive || hasActiveChild;
  };

  useEffect(() => {
    const pathsToExpand = displayedItems
      .filter((item) =>
        item.subItems?.some((subItem) => location.pathname === subItem.url)
      )
      .map((item) => item.title);

    if (pathsToExpand.length > 0) {
      setExpandedItems((prev) => {
        const newExpanded = [...prev];
        pathsToExpand.forEach((path) => {
          if (!newExpanded.includes(path)) {
            newExpanded.push(path);
          }
        });
        return newExpanded;
      });
    }
  }, [location.pathname, displayedItems]);

  return (
    <SidebarContent className="py-2">
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                {item.subItems && item.subItems.length > 0 ? (
                  <MenuItemWithSub
                    item={item}
                    isExpanded={expandedItems.includes(item.title)}
                    isActive={isActiveOrHasActiveChild(item)}
                    onToggleExpand={toggleExpand}
                    onClick={handleItemClick}
                    currentPath={location.pathname}
                    lightMode={lightMode}
                  />
                ) : (
                  <MenuItemComponent item={item} lightMode={lightMode} />
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}
