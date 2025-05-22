import { Button } from "@/components/ui/button";
import { ShieldCheck, TestTube2 } from "lucide-react";

interface ModeStepProps {
  onModeSelect: (mode: "stable" | "beta") => void;
}

export function ModeStep({ onModeSelect }: ModeStepProps) {
  console.log("🚀 ModeStep component is rendered");
  return (
    <div className="space-y-6 text-center">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Choose Creation Mode</h2>
        <p className="text-sm text-muted-foreground">
          Select whether to create a standard agent or try out new beta features.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 md:p-0">
        <Button
          variant="outline"
          className="w-full h-auto p-6 flex flex-col items-center justify-center gap-2 border-2 hover:border-green-500 dark:hover:border-green-400" // Reduced gap to gap-2
          onClick={() => {
            console.log("🚀 STABLE MODE selected");
            onModeSelect("stable");
          }}
        >
          <ShieldCheck className="h-10 w-10 text-green-500 dark:text-green-400 mb-1" /> {/* Reduced mb */}
          <span className="text-lg font-medium">Stable Mode</span>
          <p className="text-[0.7rem] leading-snug text-muted-foreground text-center max-w-xs"> {/* Smaller text, tighter leading, removed px-2, added max-w-xs for better control if needed */}
            Create an agent using the current, well-tested features and functionalities.
          </p>
        </Button>
        <Button
          variant="outline"
          className="w-full h-auto p-6 flex flex-col items-center justify-center gap-2 border-2 hover:border-purple-500 dark:hover:border-purple-400" // Reduced gap to gap-2
          onClick={() => {
            console.log("🚀 BETA MODE selected");
            onModeSelect("beta");
          }}
        >
          <TestTube2 className="h-10 w-10 text-purple-500 dark:text-purple-400 mb-1" /> {/* Reduced mb */}
          <span className="text-lg font-medium">Beta Mode</span>
          <p className="text-[0.7rem] leading-snug text-muted-foreground text-center max-w-xs"> {/* Smaller text, tighter leading, removed px-2, added max-w-xs */}
            Create an agent with access to new experimental features. May be less stable.
          </p>
        </Button>
      </div>
    </div>
  );
}
