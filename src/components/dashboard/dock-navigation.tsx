
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
      <div className="bg-black/30 backdrop-blur-xl px-4 py-3 rounded-2xl flex items-center gap-2 shadow-lg border border-white/10">
        <TooltipProvider delayDuration={200}>
          {navItems.map((item) => (
            <Tooltip key={item.title}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.url}
                  className={({ isActive }) => `
                    relative p-2 rounded-xl transition-all duration-200 group
                    ${isActive 
                      ? "bg-gradient-to-b from-white/20 to-white/5" 
                      : "hover:bg-white/10 hover:scale-110"}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <motion.div 
                        className={`p-2 rounded-lg bg-gradient-to-b ${
                          isActive 
                            ? "from-blue-500/80 to-blue-600/80 shadow-lg" 
                            : "from-gray-800/90 to-gray-900/90"
                        } flex items-center justify-center`}
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <item.icon 
                          className={`h-5 w-5 transition-all duration-200 
                            ${isActive ? "text-white" : "text-white/90 group-hover:text-white"}
                          `} 
                        />
                      </motion.div>
                      <motion.div
                        className={`absolute -bottom-1 left-1/2 w-1 h-1 bg-white rounded-full -translate-x-1/2 transition-opacity duration-200
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
