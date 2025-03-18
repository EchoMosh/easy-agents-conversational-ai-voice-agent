import { useState, useEffect } from "react";
import { SidebarSettings } from "@/components/settings/sidebar-settings";
import { DashboardSettings } from "@/components/settings/dashboard-settings";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AccountSettings } from "@/components/settings/account-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Palette,
  User,
  PanelLeft,
  LayoutDashboard,
  Sparkles,
  LucideIcon,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SettingsTabInfo {
  id: string;
  label: string;
  icon: LucideIcon;
  isNew?: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMounted, setIsMounted] = useState(false);

  // Tabs configuration
  const tabs: SettingsTabInfo[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      isNew: true,
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: Palette,
    },
    {
      id: "sidebar",
      label: "Sidebar",
      icon: PanelLeft,
    },
    {
      id: "account",
      label: "Account",
      icon: User,
    },
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="w-full py-6 px-4 md:px-8">
      <div className="flex flex-col mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Settings</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1">
              <ExternalLink size={14} />
              Help
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Customize your experience and manage your account preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar for large screens */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-8 space-y-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2 px-3",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : ""
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
                {tab.isNew && (
                  <Badge
                    variant="outline"
                    className="ml-auto text-xs h-5 bg-primary/20 border-primary/30"
                  >
                    New
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Tabs for mobile/tablet */}
        <div className="lg:hidden mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="relative">
                  <div className="flex flex-col items-center gap-1">
                    <tab.icon size={16} />
                    <span className="text-xs">{tab.label}</span>
                  </div>
                  {tab.isNew && (
                    <Badge
                      variant="outline"
                      className="absolute -top-2 -right-2 px-1 text-[10px] h-4 bg-primary/20 border-primary/30"
                    >
                      New
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <Card className="border-none shadow-sm">
            <CardContent className="p-0 pb-12">
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="px-2 py-4 md:px-6 md:py-6">
                  {activeTab === "dashboard" && <DashboardSettings />}

                  {activeTab === "appearance" && (
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

                      <Separator />

                      <div className="pb-4">
                        <h3 className="text-lg font-medium mb-4">Font Size</h3>
                        <div className="grid grid-cols-3 gap-4">
                          {["Small", "Medium", "Large"].map((size) => (
                            <Button
                              key={size}
                              variant={
                                size === "Medium" ? "default" : "outline"
                              }
                              className="h-12"
                            >
                              {size}
                            </Button>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Font settings will apply to all text elements in the
                          application
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === "sidebar" && <SidebarSettings />}

                  {activeTab === "account" && <AccountSettings />}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
