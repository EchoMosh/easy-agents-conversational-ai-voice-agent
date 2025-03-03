
import { User, Shuffle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SidebarHeader } from "@/components/ui/sidebar";

export function ProfileSection() {
  const [username, setUsername] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const { toast } = useToast();

  const generateRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    return `https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=${seed}&backgroundColor=8b5cf6&radius=10`;
  };

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const email = session.user.email || "";
      const name = email.split("@")[0];
      setUsername(name);

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, first_name, last_name')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setAvatarUrl(profile.avatar_url || generateRandomAvatar());
      }
    }
  };

  const handleRandomizeAvatar = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const newAvatarUrl = generateRandomAvatar();
      
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

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <SidebarHeader className="p-5 border-b border-border/10 transition-all duration-300 hover:bg-white/5">
      <div className="flex items-center gap-3.5">
        <div className="relative group">
          <Avatar className="h-11 w-11 ring-2 ring-background/80 shadow-md border border-white/10 transition-all duration-300 group-hover:ring-indigo-500/30 group-hover:scale-105">
            <AvatarImage src={avatarUrl} alt={username} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <Button
            size="icon"
            variant="ghost"
            className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 border border-white/10 hover:border-white/20 hover:scale-110"
            onClick={handleRandomizeAvatar}
            title="Randomize avatar"
          >
            <Shuffle className="h-2.5 w-2.5" />
          </Button>
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-sm tracking-wide text-white/90 transition-colors duration-300">{firstName || username}</span>
          <span className="text-xs text-indigo-300/70 font-light transition-colors duration-300">
            Welcome back!
          </span>
        </div>
      </div>
    </SidebarHeader>
  );
}
