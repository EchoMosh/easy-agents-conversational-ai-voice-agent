
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
    <SidebarHeader className="border-b p-4">
      <div className="flex items-center gap-3">
        <div className="relative group">
          <Avatar>
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback>
              <User className="h-6 w-6" />
            </AvatarFallback>
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
          <span className="font-semibold text-sm">{firstName || username}</span>
          <span className="text-xs text-muted-foreground">
            Welcome back!
          </span>
        </div>
      </div>
    </SidebarHeader>
  );
}
