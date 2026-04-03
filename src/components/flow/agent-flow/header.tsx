import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Settings,
  MoreVertical,
  Rocket,
  History,
  Copy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { AgentSettings } from "@/components/agents/settings/agent-settings-dialog";
import { Agent } from "@/types/agent";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AgentTrainingPopup } from "@/components/agents/training/agent-training-popup";
import { TestAgentDialog } from "@/components/agents/test-agent-dialog";
import { LaunchAgentDialog } from "@/components/agents/launch-agent-dialog";
import { TestAgentButton } from "@/components/agents/test-agent-button";
import { useToast } from "@/hooks/use-toast";
import AgentCallLogsModal from "@/components/agents/flow/AgentCallLogsModal"; // Corrected import path

interface HeaderProps {
  agent: Agent;
  onBack: () => void;
  onUpdateSettings: (settings: {
    voiceId?: string;
    language?: string;
    humorLevel?: number;
    maxDurationSeconds?: number;
  }) => Promise<void>;
}

export function Header({ agent, onBack, onUpdateSettings }: HeaderProps) {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(true); // Default to true for visual consistency during dev if needed
  const [showTrainingPopup, setShowTrainingPopup] = useState(false);
  const [showTestAgentDialog, setShowTestAgentDialog] =
    useState<boolean>(false);
  const [showLaunchAgentDialog, setShowLaunchAgentDialog] = useState(false);
  const [showCallLogsModal, setShowCallLogsModal] = useState(false); // Added state for call logs modal
  const [showSettingsModal, setShowSettingsModal] = useState(false); // Added state for settings modal
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const { toast } = useToast();
  const { setOpen } = useSidebar();

  useEffect(() => {
    console.log("Setting up Supabase realtime connection...");

    const channel = supabase
      .channel("agent-flow")
      .on("presence", { event: "sync" }, () => {
        console.log("Presence sync event received");
        setIsConnected(true);
      })
      .subscribe((status) => {
        console.log("Channel status changed:", status);
        setIsConnected(status === "SUBSCRIBED");
      });

    console.log("Channel created:", channel);

    const subscription = supabase.getChannels().forEach((channel) => {
      console.log("Current channel state:", channel.state);
    });

    return () => {
      console.log("Cleaning up Supabase channel...");
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    console.log("Connection status changed:", isConnected);
  }, [isConnected]);

  return (
    <>
      {/* Modern elevated header with soft shadow */}
      <div className="relative h-auto min-h-16 w-full bg-white dark:bg-slate-900 flex items-center px-6 py-3 z-50 border-b border-gray-100 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex-1 flex items-center gap-3.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-[18px] w-[18px] text-gray-700 dark:text-gray-300" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h1 className="font-semibold text-lg text-slate-800 dark:text-slate-100">
                {agent.name || "Unnamed Agent"}
              </h1>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          isConnected ? "bg-emerald-500" : "bg-red-500"
                        } ring-2 ring-white dark:ring-slate-900`}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <p>Status: {isConnected ? "Active" : "Disconnected"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {/* Agent ID Chip - Moved here, replacing role */}
            {agent.id && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(agent.id);
                  toast({
                    title: "Copied to clipboard!",
                    description: `Agent ID: ${agent.id}`,
                  });
                }}
                className="mt-0.5 flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 group"
                aria-label="Copy Agent ID"
              >
                <span className="font-mono truncate max-w-[120px] group-hover:max-w-[250px] transition-all duration-300">
                  {agent.id}
                </span>
                <Copy className="h-2.5 w-2.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </button>
            )}
          </div>
        </div>

        {/* Right-aligned action buttons with visual hierarchy */}
        <div className="flex items-center gap-3 ml-auto">
          <TestAgentButton
            onClick={() => {
              console.log("Test Agent button clicked");
              setShowTestAgentDialog(true);
            }}
          />

          <Button
            variant="default"
            className="rounded-full px-4 py-2 h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all"
            onClick={() => setShowLaunchAgentDialog(true)}
          >
            <Rocket className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-sm font-medium">Launch</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[180px] p-1.5 rounded-lg border-slate-200 dark:border-slate-700 shadow-lg"
            >
              <DropdownMenuItem
                className="flex items-center px-3 py-2 text-sm rounded-md cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                onSelect={(e) => {
                  e.preventDefault();
                  setShowSettingsModal(true);
                }}
              >
                <Settings className="mr-2.5 h-4 w-4 text-slate-600 dark:text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">
                  Settings
                </span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="flex items-center px-3 py-2 text-sm rounded-md cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                onSelect={() => {
                  navigate("/dashboard/transcriptions");
                }}
              >
                <svg
                  className="mr-2.5 h-4 w-4 text-slate-600 dark:text-slate-400"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v18h18"></path>
                  <path d="M18 17V9"></path>
                  <path d="M13 17V5"></path>
                  <path d="M8 17v-3"></path>
                </svg>
                <span className="text-slate-700 dark:text-slate-300">
                  View Analytics
                </span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="flex items-center px-3 py-2 text-sm rounded-md cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                onSelect={() => {
                  console.log(
                    "View conversation history (call logs) requested",
                  );
                  setShowCallLogsModal(true); // Open the call logs modal
                }}
              >
                <History className="mr-2.5 h-4 w-4 text-slate-600 dark:text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">
                  Call Logs
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* TooltipProvider for connection status is now integrated with the agent title */}

      <AgentTrainingPopup
        agent={agent}
        open={showTrainingPopup}
        onOpenChange={setShowTrainingPopup}
      />

      <TestAgentDialog
        open={showTestAgentDialog}
        onOpenChange={setShowTestAgentDialog}
        agent={agent}
      />

      <LaunchAgentDialog
        open={showLaunchAgentDialog}
        onOpenChange={setShowLaunchAgentDialog}
        agent={agent}
      />

      <AgentCallLogsModal
        agent={agent}
        isOpen={showCallLogsModal}
        onClose={() => setShowCallLogsModal(false)}
      />

      <AgentSettings
        agentId={agent.id}
        currentVoice={agent.voice_id || undefined}
        currentLanguage={agent.language}
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
        onUpdateSettings={onUpdateSettings}
      />
    </>
  );
}
