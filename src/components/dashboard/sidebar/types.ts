
import { LucideIcon } from "lucide-react";

export interface MenuItem {
  title: string;
  icon: LucideIcon;
  url: string;
  subItems?: MenuItem[];
  visible?: boolean;
  badge?: string;
  highlight?: boolean;
}

export interface CustomizedMenuItem {
  id: string;
  title: string;
  visible: boolean;
  icon?: string;
  subItems?: CustomizedMenuItem[];
}
