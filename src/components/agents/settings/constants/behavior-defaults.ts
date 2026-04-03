export interface BackgroundSound {
  id: string;
  name: string;
  description: string;
}

export const BACKGROUND_SOUNDS: BackgroundSound[] = [
  { id: "off", name: "Off", description: "No background sound" },
  {
    id: "office",
    name: "Office",
    description: "Subtle office ambience with keyboard and murmur",
  },
  {
    id: "cafe",
    name: "Cafe",
    description: "Warm coffee shop atmosphere with light chatter",
  },
  {
    id: "nature",
    name: "Nature",
    description: "Gentle outdoor sounds with birds and wind",
  },
];

export interface EndpointingPreset {
  id: string;
  name: string;
  description: string;
  smartEndpointing: boolean;
  waitSeconds: number;
}

export const ENDPOINTING_PRESETS: EndpointingPreset[] = [
  {
    id: "responsive",
    name: "Responsive",
    description:
      "Responds quickly after the user stops speaking. Best for fast-paced conversations.",
    smartEndpointing: true,
    waitSeconds: 0.4,
  },
  {
    id: "balanced",
    name: "Balanced",
    description: "Default timing that works well for most conversations.",
    smartEndpointing: true,
    waitSeconds: 0.8,
  },
  {
    id: "patient",
    name: "Patient",
    description:
      "Waits longer before responding. Best when users need time to think.",
    smartEndpointing: true,
    waitSeconds: 1.6,
  },
];

export interface SpeakingPlanDefaults {
  waitSeconds: number;
  smartEndpointingEnabled: boolean;
  paddingSeconds: number;
}

export interface StopPlanDefaults {
  numWords: number;
  voiceSeconds: number;
  backoffSeconds: number;
}

export interface BehaviorDefaults {
  backgroundSound: string;
  backgroundDenoisingEnabled: boolean;
  silenceTimeoutSeconds: number;
  maxDurationSeconds: number;
  speakingPlan: SpeakingPlanDefaults;
  stopPlan: StopPlanDefaults;
  endpointingPreset: string;
}

export const DEFAULT_BEHAVIOR: BehaviorDefaults = {
  backgroundSound: "off",
  backgroundDenoisingEnabled: false,
  silenceTimeoutSeconds: 30,
  maxDurationSeconds: 600,
  speakingPlan: {
    waitSeconds: 0.8,
    smartEndpointingEnabled: true,
    paddingSeconds: 0.1,
  },
  stopPlan: {
    numWords: 0,
    voiceSeconds: 0.2,
    backoffSeconds: 1.0,
  },
  endpointingPreset: "balanced",
};

export const DEFAULT_BACKGROUND_SOUND_ID = "off";
export const DEFAULT_ENDPOINTING_PRESET_ID = "balanced";

export function getEndpointingPreset(
  presetId: string,
): EndpointingPreset | undefined {
  return ENDPOINTING_PRESETS.find((p) => p.id === presetId);
}
