
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function SidebarProfile() {
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const email = session.user.email || "";
      const name = email.split("@")[0];
      setUsername(name);

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setAvatarUrl(profile.avatar_url || "");
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <Link 
      to="/dashboard/profile"
      className="flex items-center justify-center"
    >
      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
        <AvatarImage src={avatarUrl} alt={username} />
        <AvatarFallback className="bg-primary-foreground text-primary">
          {username.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}
