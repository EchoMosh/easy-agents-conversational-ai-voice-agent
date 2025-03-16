
import { useState, useEffect } from "react";
import { MenuItem } from "./types";
import { CustomizedMenuItem } from "./types";
import { mainMenuItems, iconComponents } from "./menu-items";

export function useCustomMenu() {
  const [customizedItems, setCustomizedItems] = useState<CustomizedMenuItem[]>([]);
  const [displayedItems, setDisplayedItems] = useState<MenuItem[]>(mainMenuItems);

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

  return { displayedItems };
}
