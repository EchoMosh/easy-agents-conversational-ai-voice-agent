
import { User, ChevronDown } from "lucide-react";
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
  const [companyName, setCompanyName] = useState<string>("REFORM CO. INC.");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const { toast } = useToast();

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
        setAvatarUrl(profile.avatar_url || "");
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const displayName = firstName || username;

  return (
    <SidebarHeader className="p-4 border-b">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 rounded-md bg-green-400 flex items-center justify-center">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-green-400 text-white rounded-md">
            {displayName ? displayName[0].toUpperCase() : <User className="h-5 w-5" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm text-gray-800">{displayName} {lastName && lastName[0] + "."}</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
            {companyName}
          </span>
        </div>
      </div>
    </SidebarHeader>
  );
}
