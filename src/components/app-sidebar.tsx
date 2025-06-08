"use client";

import * as React from "react";
import {
  AudioWaveform,
  GalleryVerticalEnd,
  Command,
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  Bot,
  FileText,
  Frame,
  PieChart,
  Map,
  Phone,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/context/workspace-context";

import { NavSimple } from "@/components/nav-simple";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const [username, setUsername] = useState<string>("Meng To");
  const [email, setEmail] = useState<string>("ui@designer.com");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  
  // Get workspace data from context
  const { currentWorkspace, workspaces } = useWorkspace();

  // Convert workspaces to teams format for TeamSwitcher
  const teams = workspaces.map((workspace) => ({
    name: workspace.name,
    logo: GalleryVerticalEnd, // You can map different icons based on workspace.icon
    plan: "Workspace", // You can add plan info to workspace model if needed
  }));

  // If no workspaces yet, show current workspace or fallback
  if (teams.length === 0 && currentWorkspace) {
    teams.push({
      name: currentWorkspace.name,
      logo: GalleryVerticalEnd,
      plan: "Workspace",
    });
  }


  // Define app-specific menu items that match the dock navigation
  const appMenuItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Leads",
      url: "/dashboard/leads",
      icon: Users,
    },
    {
      title: "Agents",
      url: "/dashboard/agents",
      icon: Bot,
    },
    {
      title: "Phone Numbers",
      url: "/dashboard/phone-numbers",
      icon: Phone,
    },
    {
      title: "Transcriptions",
      url: "/dashboard/transcriptions",
      icon: FileText,
    },
    {
      title: "Knowledge Base",
      url: "/dashboard/knowledge",
      icon: BookOpen,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ];


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
      className=""
      {...props}
    >
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavSimple items={appMenuItems} label="Platform" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      {/* <SidebarRail /> Removed to prevent hover-to-expand */}
    </Sidebar>
  );
}
