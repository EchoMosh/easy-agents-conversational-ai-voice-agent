import {
  MessageSquare,
  Search,
  Home,
  Grid,
  Play,
  Heart,
  DollarSign,
  HelpCircle,
  Settings,
  Moon,
  Sun,
} from "lucide-react";
import { MenuItem } from "./types";

export const historyMenuItems: MenuItem[] = [
  {
    title: "Downloads",
    icon: Play,
    url: "/dashboard/downloads",
    badge: "12",
  },
  {
    title: "Favorites",
    icon: Heart,
    url: "/dashboard/favorites",
  },
];

export const mainMenuItems: MenuItem[] = [
  {
    title: "Home",
    icon: Home,
    url: "/dashboard/home",
  },
  {
    title: "Browse",
    icon: Grid,
    url: "/dashboard/browse",
    highlight: true,
  },
  {
    title: "Topics",
    icon: MessageSquare,
    url: "/dashboard/topics",
  },
  {
    title: "Search",
    icon: Search,
    url: "/dashboard/search",
  },
  {
    title: "Pricing",
    icon: DollarSign,
    url: "/dashboard/pricing",
  },
  {
    title: "Help",
    icon: HelpCircle,
    url: "/dashboard/help",
  },
];

export const settingsMenuItems: MenuItem[] = [
  {
    title: "Settings",
    icon: Settings,
    url: "/dashboard/settings",
  },
];

// Create an icons object for easy lookup
export const iconComponents = {
  MessageSquare,
  Search,
  Home,
  Grid,
  Play,
  Heart,
  DollarSign,
  HelpCircle,
  Settings,
  Moon,
  Sun,
  ChevronDown: () => import("lucide-react").then((mod) => mod.ChevronDown),
  ChevronUp: () => import("lucide-react").then((mod) => mod.ChevronUp),
};
