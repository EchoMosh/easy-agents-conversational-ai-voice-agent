
import { SidebarSettings } from "@/components/settings/sidebar-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AccountSettings } from "@/components/settings/account-settings";

export default function SettingsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>
                  Choose your preferred theme appearance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>Switch between dark and light mode</span>
                  <ThemeToggle />
                </div>
              </CardContent>
            </Card>
            
            <SidebarSettings />
          </div>
        </section>

        <AccountSettings />
      </div>
    </div>
  );
}
