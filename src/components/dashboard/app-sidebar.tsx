import { Users, Target, Settings, User, Shuffle, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
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

const AVATAR_VARIANT = "beam";

export function AppSidebar() {
  const [username, setUsername] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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

      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url);
      } else {
        const hash = btoa(email).replace(/[^a-zA-Z0-9]/g, "");
        const defaultAvatar = `https://source.boringavatars.com/svg?variant=${AVATAR_VARIANT}&name=${hash}`;
        setAvatarUrl(defaultAvatar);
      }
    }
  };

  useEffect(() => {
    fetchProfile();
    setTimeout(() => setIsVisible(true), 500);
  }, []);

  const handleRandomizeAvatar = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const randomSeed = Math.random().toString(36).substring(7);
      const newAvatarUrl = `https://source.boringavatars.com/svg?variant=${AVATAR_VARIANT}&name=${randomSeed}`;
      
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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out",
      });
    } else {
      navigate('/auth');
      toast({
        title: "Success",
        description: "Signed out successfully",
      });
    }
  };

  const sidebarVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={sidebarVariants}
        >
          <Sidebar>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
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
            </motion.div>

            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <SidebarMenu>
                      {mainMenuItems.map((item, index) => (
                        <motion.div key={item.title} variants={itemVariants}>
                          <SidebarMenuItem>
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
                        </motion.div>
                      ))}
                    </SidebarMenu>
                  </motion.div>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup className="mt-auto border-t pt-4">
                <SidebarGroupContent>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <SidebarMenu>
                      {bottomMenuItems.map((item) => (
                        <motion.div key={item.title} variants={itemVariants}>
                          <SidebarMenuItem>
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
                        </motion.div>
                      ))}
                      <motion.div variants={itemVariants}>
                        <SidebarMenuItem>
                          <SidebarMenuButton>
                            <button
                              onClick={handleLogout}
                              className="flex w-full items-center gap-3 px-3 py-2 rounded-md transition-colors text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <LogOut className="h-4 w-4" />
                              <span>Log Out</span>
                            </button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </motion.div>
                    </SidebarMenu>
                  </motion.div>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
