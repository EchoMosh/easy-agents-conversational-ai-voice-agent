
import { SidebarSettings } from "@/components/settings/sidebar-settings";

export default function SettingsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          <SidebarSettings />
        </section>
        
        {/* You can add more settings sections here */}
      </div>
    </div>
  );
}
