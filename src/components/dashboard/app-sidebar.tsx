
import { Users, Target, Settings, User, Shuffle } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const mainMenuItems = [
  {
    title: "Agents",
    icon: Users,
    url: "/agents",
  },
  {
    title: "Leads",
    icon: Target,
    url: "/leads",
  },
];

const bottomMenuItems = [
  {
    title: "Settings",
    icon: Settings,
    url: "/settings",
  },
  {
    title: "Profile",
    icon: User,
    url: "/profile",
  },
];

// Available variants: marble, beam, pixel, sunset, ring, bauhaus
const AVATAR_VARIANT = "beam";

export function AppSidebar() {
  const [username, setUsername] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const { toast } = useToast();

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const email = session.user.email || "";
      const name = email.split("@")[0];
      setUsername(name);

      // Get the saved avatar URL from the profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', session.user.id)
        .single();

      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url);
      } else {
        // Generate a default avatar if none is saved
        const hash = btoa(email).replace(/[^a-zA-Z0-9]/g, "");
        const defaultAvatar = `https://source.boringavatars.com/svg?variant=${AVATAR_VARIANT}&name=${hash}`;
        setAvatarUrl(defaultAvatar);
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRandomizeAvatar = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // Generate a random seed
      const randomSeed = Math.random().toString(36).substring(7);
      const newAvatarUrl = `https://source.boringavatars.com/svg?variant=${AVATAR_VARIANT}&name=${randomSeed}`;
      
      // Save the new avatar URL to the profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', session.user.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update avatar",
        });
      } else {
        setAvatarUrl(newAvatarUrl);
        toast({
          title: "Success",
          description: "Avatar updated successfully",
        });
      }
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Avatar>
              <AvatarImage src={avatarUrl} alt={username} />
              <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="ghost"
              className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRandomizeAvatar}
              title="Randomize avatar"
            >
              <Shuffle className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{username}</span>
            <span className="text-xs text-muted-foreground">Welcome back!</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto border-t pt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
