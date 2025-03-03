
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Power } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export function SidebarProfile() {
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [sessionTime, setSessionTime] = useState<string>("");
  const { open } = useSidebar();

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
      
      // Set random session time between 5-15 minutes
      const minutes = Math.floor(Math.random() * 10) + 5;
      const seconds = Math.floor(Math.random() * 60);
      setSessionTime(`${minutes} min ${seconds}s`);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (!open) {
    return (
      <Link 
        to="/dashboard/profile"
        className="flex items-center justify-center"
      >
        <Avatar className="h-12 w-12 border-2 border-white shadow-sm bg-rose-100">
          <AvatarImage src={avatarUrl} alt={username} />
          <AvatarFallback className="bg-rose-100 text-rose-600">
            {username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
    );
  }

  return (
    <div className="w-full px-3">
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
        <Link to="/dashboard/profile" className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-white shadow-sm bg-rose-100">
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback className="bg-rose-100 text-rose-600">
              {username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{username}</span>
            <span className="text-xs text-gray-500">Session ends in {sessionTime}</span>
          </div>
        </Link>
        
        <button 
          className="h-8 w-8 flex items-center justify-center bg-green-600 text-white rounded-md"
          title="Logout"
          onClick={() => supabase.auth.signOut()}
        >
          <Power className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
