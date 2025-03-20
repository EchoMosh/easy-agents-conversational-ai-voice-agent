
import { useState, useEffect } from "react";
import { User, ChevronsUpDown, Settings, LogOut } from "lucide-react";
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md py-1 px-3 text-left text-sm border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-colors">
          <Avatar className="h-8 w-8 rounded-full border bg-white flex-shrink-0">
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback className="rounded-full">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block overflow-hidden">
            <span className="text-sm font-medium truncate block">{username}</span>
          </div>
          <ChevronsUpDown className="ml-1 size-4 opacity-70 flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-64 rounded-lg"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-3 p-3 text-left text-sm">
            <Avatar className="h-10 w-10 rounded-full">
              <AvatarImage src={avatarUrl} alt={username} />
              <AvatarFallback className="rounded-full">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 min-w-0 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{username}</span>
              <span className="truncate text-xs opacity-70">{email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
