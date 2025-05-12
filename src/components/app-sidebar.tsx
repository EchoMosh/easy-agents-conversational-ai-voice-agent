"use client";

import * as React from "react";
import {
  AudioWaveform,
  GalleryVerticalEnd,
  Command,
  MessageSquare,
  Search,
  Home,
  Grid,
  Play,
  Heart,
  DollarSign,
  HelpCircle,
  Settings,
  Frame,
  PieChart,
  Map,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  mainMenuItems,
  historyMenuItems,
} from "@/components/dashboard/sidebar/menu-items";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const [username, setUsername] = useState<string>("Meng To");
  const [email, setEmail] = useState<string>("ui@designer.com");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  // Sample data for the sidebar components
  const teams = [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ];

  const projects = [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ];

  // Format existing menu items to match the NavMain component's expected format
  const navMainItems = mainMenuItems.map((item) => {
    // Check if the current path matches this menu item's URL exactly
    const isPathExactMatch = location.pathname === item.url;

    // For sub-path matching, we need to be more specific:
    // 1. The current path should start with the menu item's URL
    // 2. The menu item's URL shouldn't be the dashboard home URL to prevent it from being active for all dashboard routes
    // 3. The menu item's URL length should be greater than "/dashboard/" to avoid unwanted matches
    const isSubPathMatch =
      location.pathname.startsWith(item.url) &&
      item.url !== "/dashboard/home" &&
      // Ensure we're not matching "/dashboard/" as a parent of all dashboard routes
      (item.url === "/dashboard/" ? location.pathname === "/dashboard/" : true);

    return {
      title: item.title,
      url: item.url,
      icon: item.icon,
      isActive: isPathExactMatch || isSubPathMatch,
      items: [], // No subitems for now
    };
  });

  // Add history items to the navMainItems
  const navHistoryItems = historyMenuItems.map((item) => {
    const isPathExactMatch = location.pathname === item.url;
    // Apply the same specific sub-path matching logic for consistency
    const isSubPathMatch =
      location.pathname.startsWith(item.url) &&
      !item.url.endsWith("/dashboard/");

    return {
      title: item.title,
      url: item.url,
      icon: item.icon,
      isActive: isPathExactMatch || isSubPathMatch,
      items: [], // No subitems for now
    };
  });

  const generateRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    return `https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=${seed}&backgroundColor=999999&radius=50`;
  };

  const fetchProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      const userEmail = session.user.email || "";
      setEmail(userEmail);
      const name = userEmail.split("@")[0];

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, first_name, last_name")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setUsername(profile.first_name || name);
        setAvatarUrl(profile.avatar_url || generateRandomAvatar());
      } else {
        setAvatarUrl(generateRandomAvatar());
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // User data for NavUser component
  const userData = {
    name: username,
    email: email,
    avatar: avatarUrl || "/avatars/shadcn.jpg",
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r bg-[#1e2235] text-white"
      {...props}
    >
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
        <NavMain items={navHistoryItems} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      {/* <SidebarRail /> Removed to prevent hover-to-expand */}
    </Sidebar>
  );
}
