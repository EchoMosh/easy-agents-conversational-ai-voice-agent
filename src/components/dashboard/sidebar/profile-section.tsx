import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { SidebarHeader } from "@/components/ui/sidebar";

interface ProfileSectionProps {
  lightMode?: boolean;
}

export function ProfileSection({ lightMode = false }: ProfileSectionProps) {
  const [username, setUsername] = useState<string>("Meng To");
  const [role, setRole] = useState<string>("UI Designer");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  const generateRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    return `https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=${seed}&backgroundColor=${
      lightMode ? "e0e0e0" : "999999"
    }&radius=50`;
  };

  const fetchProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const userEmail = session.user.email || "";
        const name = userEmail.split("@")[0];

        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url, first_name, last_name")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setUsername(profile.first_name || name);
          setRole("UI Designer"); // Hardcoded for demo
          setAvatarUrl(profile.avatar_url || generateRandomAvatar());
        } else {
          setAvatarUrl(generateRandomAvatar());
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <SidebarHeader className="p-4">
      <div className="flex items-center gap-3 p-2">
        <div className="relative">
          <Avatar
            className={`h-10 w-10 ${
              lightMode ? "bg-gray-200/70" : "bg-gray-500/30"
            }`}
          >
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback
              className={`${
                lightMode
                  ? "bg-gray-200/70 text-gray-700"
                  : "bg-gray-500/30 text-white"
              }`}
            >
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex flex-col">
          <span
            className={`font-medium text-sm ${
              lightMode ? "text-[#1e2235]" : "text-white"
            }`}
          >
            {username}
          </span>
          <span
            className={`text-xs ${
              lightMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            {role}
          </span>
        </div>
      </div>
    </SidebarHeader>
  );
}
