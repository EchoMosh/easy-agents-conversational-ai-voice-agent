
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Target, GitMerge, MessageSquare, Book, Settings } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  {
    title: "Agents",
    icon: Users,
    url: "/dashboard/agents",
    color: "from-purple-500 to-indigo-600",
  },
  {
    title: "Leads",
    icon: Target,
    url: "/dashboard/leads",
    color: "from-orange-400 to-pink-600",
  },
  {
    title: "Pipelines",
    icon: GitMerge,
    url: "/dashboard/pipelines",
    color: "from-blue-400 to-cyan-500",
  },
  {
    title: "Chats",
    icon: MessageSquare,
    url: "/dashboard/chats",
    color: "from-green-400 to-teal-500",
  },
  {
    title: "Knowledge",
    icon: Book,
    url: "/dashboard/knowledge",
    color: "from-yellow-400 to-amber-500",
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/dashboard/settings",
    color: "from-gray-500 to-gray-700",
  },
];

export function DockNavigation() {
  const location = useLocation();
  const isAgentFlowPage = location.pathname.includes('/dashboard/agents/flow/');
  
  return (
    <motion.div 
      className={`fixed bottom-0 left-0 right-0 flex justify-center pb-4 ${isAgentFlowPage ? 'z-10' : 'z-50'}`}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="bg-black/25 backdrop-blur-xl px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl border border-white/10">
        <TooltipProvider delayDuration={200}>
          {navItems.map((item) => (
            <Tooltip key={item.title}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.url}
                  className={({ isActive }) => `
                    relative group
                  `}
                >
                  {({ isActive }) => (
                    <div className="p-1.5">
                      <motion.div 
                        className={`p-3 rounded-xl bg-gradient-to-br ${item.color} shadow-lg flex items-center justify-center
                          transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-80 hover:opacity-100'}
                        `}
                        whileHover={{ 
                          scale: 1.15, 
                          y: -5,
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <item.icon 
                          className="h-5 w-5 text-white drop-shadow-sm" 
                        />
                      </motion.div>
                      
                      {isActive && (
                        <motion.div 
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 w-1 bg-white rounded-full"
                          layoutId="navIndicator"
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30
                          }}
                        />
                      )}
                    </div>
                  )}
                </NavLink>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                className="font-medium bg-white/90 text-black backdrop-blur-xl border-none"
                sideOffset={10}
              >
                {item.title}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </motion.div>
  );
}
