
import { HomeIcon } from "lucide-react";
import { Link } from "react-router-dom";

export function SidebarLogo() {
  return (
    <Link 
      to="/dashboard/overview"
      className="flex flex-col items-center justify-center gap-1"
    >
      <div className="flex items-center justify-center h-12 w-12 bg-rose-100 rounded-full">
        <HomeIcon className="h-5 w-5 text-rose-600" />
      </div>
    </Link>
  );
}
