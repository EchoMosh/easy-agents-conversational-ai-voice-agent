import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { IntegrationsSettings } from "@/components/settings/integrations-settings";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/login"); // Redirect to login page after logout
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="w-full py-6 px-4 md:px-8">
      <div className="flex flex-col mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex-1">
          <Card className="border-none shadow-sm">
            <CardContent className="p-0 pb-12">
              <div className="px-2 py-4 md:px-6 md:py-6">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold mb-6">
                      Appearance Settings
                    </h2>

                    <Card className="bg-card/50">
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-medium">Theme</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Choose between light and dark mode for your
                              workspace
                            </p>
                          </div>

                          <div className="scale-100 transition-transform">
                            <ThemeToggle />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <IntegrationsSettings />

                  <div className="pb-4">
                    <h3 className="text-lg font-medium mb-4">Logout</h3>
                    <Button onClick={handleLogout} variant="destructive">
                      Log Out
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Sign out of your account to secure your session.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
