
import { Button } from "@/components/ui/button";
import { PhoneOff, Volume2, VolumeX } from "lucide-react";

interface CallControlsProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onEnd: () => void;
}

export function CallControls({ isMuted, onToggleMute, onEnd }: CallControlsProps) {
  return (
    <div className="flex justify-center space-x-4 p-4">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full h-12 w-12"
        onClick={onToggleMute}
      >
        {isMuted ? <VolumeX /> : <Volume2 />}
      </Button>
      
      <Button 
        variant="destructive"
        size="icon"
        className="rounded-full h-12 w-12"
        onClick={onEnd}
      >
        <PhoneOff />
      </Button>
    </div>
  );
}
