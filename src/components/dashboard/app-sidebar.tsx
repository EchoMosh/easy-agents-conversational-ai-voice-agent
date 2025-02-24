
import { Sidebar } from "@/components/ui/sidebar";
import { ProfileSection } from "./sidebar/profile-section";
import { NavigationMenu } from "./sidebar/navigation-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function AppSidebar() {
  return (
    <Sidebar>
      <ProfileSection />
      <NavigationMenu />
      <div className="mt-auto p-4 border-t">
        <ThemeToggle />
      </div>
    </Sidebar>
  );
}
