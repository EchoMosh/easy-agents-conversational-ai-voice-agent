import { useState, useEffect } from "react";
import { User, ChevronsUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";

export function UserProfileSection() {
  const [username, setUsername] = useState<string>("Meng To");
  const [email, setEmail] = useState<string>("m@example.com");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const { isMobile } = useSidebar();

  const generateRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    return `https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=${seed}&backgroundColor=ffffff&radius=50`;
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

  return (
    <div className="p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-3 rounded-md p-2 text-left text-sm outline-none ring-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Avatar className="h-8 w-8 rounded-lg border bg-white">
              <AvatarImage src={avatarUrl} alt={username} />
              <AvatarFallback className="rounded-lg">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{username}</span>
              <span className="truncate text-xs opacity-70">{email}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 opacity-70" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={avatarUrl} alt={username} />
                <AvatarFallback className="rounded-lg">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{username}</span>
                <span className="truncate text-xs opacity-70">{email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
