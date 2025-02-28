
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Target, GitMerge, MessageSquare, Book, Settings } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  {
    title: "Agents",
    icon: Users,
    url: "/dashboard/agents",
  },
  {
    title: "Leads",
    icon: Target,
    url: "/dashboard/leads",
  },
  {
    title: "Pipelines",
    icon: GitMerge,
    url: "/dashboard/pipelines",
  },
  {
    title: "Chats",
    icon: MessageSquare,
    url: "/dashboard/chats",
  },
  {
    title: "Knowledge",
    icon: Book,
    url: "/dashboard/knowledge",
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/dashboard/settings",
  },
];

export function DockNavigation() {
  const location = useLocation();
  const isAgentFlowPage = location.pathname.includes('/dashboard/agents/flow/');
  
  return (
    <motion.div 
      className={`fixed bottom-0 left-0 right-0 flex justify-center pb-2 ${isAgentFlowPage ? 'z-10' : 'z-50'}`}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="bg-black/20 backdrop-blur-xl px-4 py-2 rounded-full flex items-center gap-1 shadow-lg">
        <TooltipProvider delayDuration={200}>
          {navItems.map((item) => (
            <Tooltip key={item.title}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.url}
                  className={({ isActive }) => `
                    relative p-2 rounded-full transition-all duration-200 group
                    ${isActive ? "bg-white/20" : "hover:bg-white/10"}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon 
                        className={`h-6 w-6 transition-all duration-200 
                          ${isActive ? "text-white" : "text-white/70 group-hover:text-white"}
                        `} 
                      />
                      <motion.div
                        className={`absolute bottom-0 left-1/2 w-1 h-1 bg-white rounded-full -translate-x-1/2 transition-opacity duration-200
                          ${isActive ? "opacity-100" : "opacity-0"}
                        `}
                        layoutId="indicator"
                      />
                    </>
                  )}
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-medium">
                {item.title}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </motion.div>
  );
}
