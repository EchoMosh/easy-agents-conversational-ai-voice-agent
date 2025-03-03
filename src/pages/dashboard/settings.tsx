
import { useState } from "react";
import { SidebarSettings } from "@/components/settings/sidebar-settings";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AccountSettings } from "@/components/settings/account-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, User, Layout } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("appearance");
  
  return (
    <div className="container max-w-5xl py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      
      <Tabs 
        defaultValue="appearance" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Monitor size={16} />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="sidebar" className="flex items-center gap-2">
            <Layout size={16} />
            <span>Sidebar</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User size={16} />
            <span>Account</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Theme</h3>
                  <p className="text-sm text-muted-foreground">
                    Switch between dark and light mode
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sidebar" className="space-y-4">
          <SidebarSettings />
        </TabsContent>
        
        <TabsContent value="account" className="space-y-4">
          <AccountSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
