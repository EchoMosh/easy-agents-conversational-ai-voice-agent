
import { HomeIcon } from "lucide-react";
import { Link } from "react-router-dom";

export function SidebarLogo() {
  return (
    <Link 
      to="/dashboard/overview"
      className="flex flex-col items-center justify-center gap-1"
    >
      <div className="flex items-center justify-center">
        <HomeIcon className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium">Be.run</span>
    </Link>
  );
}
