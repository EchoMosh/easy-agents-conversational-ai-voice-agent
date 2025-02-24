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
    hidden: { 
      x: -500,
      opacity: 0,
      rotate: -10,
    },
    visible: { 
      x: 0,
      opacity: 1,
      rotate: 0,
      transition: { 
        type: "spring",
        damping: 20,
        stiffness: 100,
        duration: 0.8
      }
    }
  };

  const itemVariants = {
    hidden: { 
      x: -50,
      opacity: 0,
      scale: 0.3,
    },
    visible: { 
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 200,
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.6
      }
    }
  };

  const ParticleEffect = ({ children }: { children: React.ReactNode }) => (
    <motion.div
      className="relative"
      initial="hidden"
      animate="visible"
      variants={itemVariants}
    >
      <div className="relative z-10">
        {children}
      </div>
      <motion.div
        className="absolute inset-0 bg-primary/5 rounded-md"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 0.2, 0] }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
        }}
      />
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 bg-primary/5 rounded-md"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0, 0.1, 0],
            scale: [0.8, 1.2, 1.4],
            x: [0, (i - 2.5) * 10],
            y: [0, (i - 2.5) * -10],
          }}
          transition={{
            duration: 1,
            ease: "easeOut",
            delay: i * 0.1,
          }}
        />
      ))}
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={sidebarVariants}
          className="will-change-transform"
        >
          <Sidebar>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <SidebarHeader className="border-b p-4">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="relative group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
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
                  </motion.div>
                  <div className="flex flex-col">
                    <motion.span 
                      className="font-semibold text-sm"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 }}
                    >
                      {username}
                    </motion.span>
                    <motion.span 
                      className="text-xs text-muted-foreground"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.4 }}
                    >
                      Welcome back!
                    </motion.span>
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
                        <ParticleEffect key={item.title}>
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
                                <motion.div
                                  whileHover={{ scale: 1.2, rotate: 10 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <item.icon className="h-4 w-4" />
                                </motion.div>
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        </ParticleEffect>
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
                        <ParticleEffect key={item.title}>
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
                                <motion.div
                                  whileHover={{ scale: 1.2, rotate: 10 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <item.icon className="h-4 w-4" />
                                </motion.div>
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        </ParticleEffect>
                      ))}
                      <ParticleEffect>
                        <SidebarMenuItem>
                          <SidebarMenuButton>
                            <button
                              onClick={handleLogout}
                              className="flex w-full items-center gap-3 px-3 py-2 rounded-md transition-colors text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <motion.div
                                whileHover={{ scale: 1.2, rotate: 10 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <LogOut className="h-4 w-4" />
                              </motion.div>
                              <span>Log Out</span>
                            </button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </ParticleEffect>
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
