
import { Sidebar } from "@/components/ui/sidebar";
import { ProfileSection } from "./sidebar/profile-section";
import { NavigationMenu } from "./sidebar/navigation-menu";

export function AppSidebar() {
  return (
    <Sidebar>
      <ProfileSection />
      <NavigationMenu />
    </Sidebar>
  );
}
