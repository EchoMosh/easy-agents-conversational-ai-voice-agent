import { useState, useEffect } from "react";
import { User, ChevronDown, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { Button } from "@/components/ui/button";

export function HeaderProfileSection() {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const generateRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    return `https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=${seed}&backgroundColor=ffffff&radius=50`;
  };

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
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
          setUsername(name);
          setAvatarUrl(generateRandomAvatar());
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="flex items-center">
      {/* User profile dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm outline-none ring-0 bg-muted/50 hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow transition-all">
            <Avatar className="h-8 w-8 rounded-full border-2 border-primary/20 bg-white">
              <AvatarImage src={avatarUrl} alt={username} />
              <AvatarFallback className="rounded-full">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <span className="font-medium">
                {isLoading ? 
                  <span className="inline-block w-16 h-4 bg-muted animate-pulse rounded"></span> : 
                  username
                }
              </span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-70" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="min-w-56 rounded-lg"
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
            <DropdownMenuItem onSelect={() => navigate("/dashboard/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate("/dashboard/settings")}>
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
    </div>
  );
}
