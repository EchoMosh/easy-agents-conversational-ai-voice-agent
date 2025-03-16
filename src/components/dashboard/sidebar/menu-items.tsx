
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
  Search
} from "lucide-react";
import { MenuItem } from "./types";

export const mainMenuItems: MenuItem[] = [
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
    icon: Search,
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

// Create an icons object for easy lookup
export const iconComponents = {
  Users,
  Target,
  Settings,
  GitMerge,
  MessageSquare,
  Book,
  Zap,
  ChevronDown: () => import("lucide-react").then(mod => mod.ChevronDown),
  ChevronUp: () => import("lucide-react").then(mod => mod.ChevronUp), 
  ChevronLeft: () => import("lucide-react").then(mod => mod.ChevronLeft), 
  ChevronRight: () => import("lucide-react").then(mod => mod.ChevronRight),
  ArrowUp: () => import("lucide-react").then(mod => mod.ArrowUp),
  ArrowDown: () => import("lucide-react").then(mod => mod.ArrowDown),
  ArrowLeft: () => import("lucide-react").then(mod => mod.ArrowLeft),
  ArrowRight: () => import("lucide-react").then(mod => mod.ArrowRight),
  LayoutDashboard,
  CalendarDays,
  Search
};
