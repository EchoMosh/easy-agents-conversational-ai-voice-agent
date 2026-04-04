import * as React from "react";
import { Button } from "@/components/ui/button";
import { CustomModal, CustomModalFooter } from "./custom-modal";
import { Label } from "@/components/ui/label";
import { Play, Pause, X, Info, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchDocuments } from "@/utils/knowledge-api";
import { supabase } from "@/integrations/supabase/client";
import { Agent } from "@/types/agent";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  uploadFileToVapi,
  createTrieveDataset,
  uploadToTrieve,
  createVapiKnowledgeBase,
  updateAgentKnowledgeBase,
  createKnowledgeBaseFromDocuments,
  VapiFile,
} from "@/utils/vapi-knowledge-api";
import { Upload, FileText, Loader2 } from "lucide-react";

// Type for voice preview cache
interface VoicePreview {
  voice_id: string;
  voice_name: string;
  preview_url: string;
}

// Helper function to convert country code to flag emoji
const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Type for ElevenLabs Voice
interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  labels: {
    gender: string;
    accent: string;
  };
  samples: { sample_id: string }[];
}

// Updated languages data with correct language codes
const languages = [
  { id: "en", name: "English" },
  { id: "zh", name: "Chinese" },
  { id: "es", name: "Spanish" },
  { id: "hi", name: "Hindi" },
  { id: "pt", name: "Portuguese" },
  { id: "fr", name: "French" },
  { id: "de", name: "German" },
  { id: "ja", name: "Japanese" },
  { id: "ar", name: "Arabic" },
  { id: "ko", name: "Korean" },
  { id: "id", name: "Indonesian" },
  { id: "it", name: "Italian" },
  { id: "nl", name: "Dutch" },
  { id: "tr", name: "Turkish" },
  { id: "pl", name: "Polish" },
  { id: "ru", name: "Russian" },
  { id: "sv", name: "Swedish" },
  { id: "ms", name: "Malay" },
  { id: "ro", name: "Romanian" },
  { id: "uk", name: "Ukrainian" },
  { id: "el", name: "Greek" },
  { id: "cs", name: "Czech" },
  { id: "da", name: "Danish" },
  { id: "fi", name: "Finnish" },
  { id: "bg", name: "Bulgarian" },
  { id: "hr", name: "Croatian" },
  { id: "sk", name: "Slovak" },
  { id: "ta", name: "Tamil" },
  { id: "vi", name: "Vietnamese" },
  { id: "no", name: "Norwegian" },
  { id: "hu", name: "Hungarian" },
  { id: "pt-br", name: "Portuguese (Brazil)" },
];

const DEFAULT_VOICE_ID = "Elliot";

const BUILT_IN_VOICES: ElevenLabsVoice[] = [
  {
    voice_id: "Elliot",
    name: "Elliot",
    labels: { gender: "male", accent: "" },
    samples: [],
  },
  {
    voice_id: "Clara",
    name: "Clara",
    labels: { gender: "female", accent: "" },
    samples: [],
  },
  {
    voice_id: "Godfrey",
    name: "Godfrey",
    labels: { gender: "male", accent: "" },
    samples: [],
  },
  {
    voice_id: "Layla",
    name: "Layla",
    labels: { gender: "female", accent: "" },
    samples: [],
  },
  {
    voice_id: "Sid",
    name: "Sid",
    labels: { gender: "male", accent: "" },
    samples: [],
  },
  {
    voice_id: "Gustavo",
    name: "Gustavo",
    labels: { gender: "male", accent: "" },
    samples: [],
  },
  {
    voice_id: "Rohan",
    name: "Rohan",
    labels: { gender: "male", accent: "" },
    samples: [],
  },
  {
    voice_id: "Savannah",
    name: "Savannah",
    labels: { gender: "female", accent: "" },
    samples: [],
  },
  {
    voice_id: "Nico",
    name: "Nico",
    labels: { gender: "male", accent: "" },
    samples: [],
  },
  {
    voice_id: "Kai",
    name: "Kai",
    labels: { gender: "male", accent: "" },
    samples: [],
  },
  {
    voice_id: "Emma",
    name: "Emma",
    labels: { gender: "female", accent: "" },
    samples: [],
  },
  {
    voice_id: "Sagar",
    name: "Sagar",
    labels: { gender: "male", accent: "" },
    samples: [],
  },
  {
    voice_id: "Neil",
    name: "Neil",
    labels: { gender: "male", accent: "" },
    samples: [],
  },
  {
    voice_id: "Naina",
    name: "Naina",
    labels: { gender: "female", accent: "" },
    samples: [],
  },
  {
    voice_id: "Leah",
    name: "Leah",
    labels: { gender: "female", accent: "" },
    samples: [],
  },
  {
    voice_id: "Tara",
    name: "Tara",
    labels: { gender: "female", accent: "" },
    samples: [],
  },
  {
    voice_id: "Jess",
    name: "Jess",
    labels: { gender: "female", accent: "" },
    samples: [],
  },
  {
    voice_id: "Leo",
    name: "Leo",
    labels: { gender: "male", accent: "" },
    samples: [],
  },
  {
    voice_id: "Dan",
    name: "Dan",
    labels: { gender: "male", accent: "" },
    samples: [],
  },
  {
    voice_id: "Mia",
    name: "Mia",
    labels: { gender: "female", accent: "" },
    samples: [],
  },
  {
    voice_id: "Zac",
    name: "Zac",
    labels: { gender: "male", accent: "" },
    samples: [],
  },
  {
    voice_id: "Zoe",
    name: "Zoe",
    labels: { gender: "female", accent: "" },
    samples: [],
  },
];

interface AgentSettingsProps {
  agentId: string;
  currentVoice?: string;
  currentLanguage?: string;
  currentHumorLevel?: number;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onUpdateSettings: (settings: {
    voiceId?: string;
    language?: string;
    humorLevel?: number;
    maxDurationSeconds?: number;
  }) => Promise<void>;
}

export function AgentSettings({
  agentId,
  currentVoice,
  currentLanguage,
  children,
  open: controlledOpen,
  onOpenChange,
  onUpdateSettings,
}: AgentSettingsProps) {
  // Remove internal state - make it fully controlled
  const open = controlledOpen ?? false;
  const setOpen = React.useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      if (onOpenChange) {
        // Handle both direct boolean values and updater functions
        const newValue = typeof value === "function" ? value(open) : value;
        onOpenChange(newValue);
        // Only clear body styles when closing the modal, and be more specific about what we're cleaning up
        if (!newValue) {
          setTimeout(() => {
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
            // Only target specific modal overlays from this dialog, not all overlays
            const dialogOverlays = document.querySelectorAll(
              "[data-radix-dialog-overlay]",
            );
            dialogOverlays.forEach((overlay) => {
              const element = overlay as HTMLElement;
              // Only hide if it's not currently being used by another dialog
              if (!element.closest('[data-state="open"]')) {
                element.style.display = "none";
              }
            });
          }, 100); // Slightly longer delay to ensure proper cleanup order
        }
      }
    },
    [onOpenChange, open],
  );
  const [activeTab, setActiveTab] = React.useState("voice");
  const [voices, setVoices] = React.useState<ElevenLabsVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = React.useState(currentVoice);
  const [language, setLanguage] = React.useState(currentLanguage || "en");
  const [knowledgeBase, setKnowledgeBase] = React.useState("none");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPreviewingVoice, setIsPreviewingVoice] = React.useState(false);
  const [audioElement, setAudioElement] =
    React.useState<HTMLAudioElement | null>(null);

  // Advanced settings
  const [acknowledgementPhrases, setAcknowledgementPhrases] = React.useState<
    string[]
  >(["I understand", "I see", "got it"]);
  const [vapiAgentId, setVapiAgentId] = React.useState<string | null>(null);
  const [firstMessage, setFirstMessage] = React.useState<string>("");
  const [mermaidChart, setMermaidChart] = React.useState<string>("");
  const [loadedAgentData, setLoadedAgentData] = React.useState<Agent | null>(
    null,
  );

  // Vapi Knowledge Base states
  const [uploadedFiles, setUploadedFiles] = React.useState<
    Array<{ name: string; content: string; type: string }>
  >([]);
  const [isUploadingFile, setIsUploadingFile] = React.useState(false);
  const [isCreatingKnowledgeBase, setIsCreatingKnowledgeBase] =
    React.useState(false);
  const [kbSearchType, setKbSearchType] = React.useState<
    "semantic" | "fulltext" | "hybrid"
  >("semantic");
  const [kbTopK, setKbTopK] = React.useState(3);
  const [kbScoreThreshold, setKbScoreThreshold] = React.useState(0.7);
  const [vapiKnowledgeBaseId, setVapiKnowledgeBaseId] = React.useState<
    string | null
  >(null);
  const [trieveDatasetId, setTrieveDatasetId] = React.useState<string | null>(
    null,
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const {
    data: knowledgeDocuments,
    isLoading: isLoadingDocuments,
    refetch,
  } = useQuery({
    queryKey: ["knowledgeDocuments"],
    queryFn: fetchDocuments,
    staleTime: 0,
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio();

      audio.onended = () => {
        setIsPreviewingVoice(false);
      };

      audio.onerror = (e) => {
        setIsPreviewingVoice(false);
        toast({
          title: "Error",
          description: "Audio playback failed",
          variant: "destructive",
        });
      };

      setAudioElement(audio);
    }

    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
      }
    };
  }, []);

  React.useEffect(() => {
    const fetchVoices = () => {
      setVoices(BUILT_IN_VOICES);
      if (!selectedVoice) {
        setSelectedVoice(DEFAULT_VOICE_ID);
      }
    };

    if (open) {
      fetchVoices();
      refetch();

      const fetchAgentData = async () => {
        try {
          const { data, error } = await supabase
            .from("agents")
            .select("*")
            .eq("id", agentId)
            .maybeSingle();

          if (error) throw error;

          if (data) {
            const agentData = data as unknown as Agent;
            setLoadedAgentData(agentData);

            if (agentData.voice_id) {
              const isValidVoice = BUILT_IN_VOICES.some(
                (v) => v.voice_id === agentData.voice_id,
              );
              setSelectedVoice(
                isValidVoice ? agentData.voice_id : DEFAULT_VOICE_ID,
              );
            }

            if (agentData.language) {
              setLanguage(agentData.language);
            }

            if (agentData.knowledge_ids && agentData.knowledge_ids.length > 0) {
              setKnowledgeBase(agentData.knowledge_ids[0]);
            } else {
              setKnowledgeBase("none");
            }

            if (agentData.speaking_behavior?.acknowledgementPhrases) {
              setAcknowledgementPhrases(
                agentData.speaking_behavior.acknowledgementPhrases,
              );
            }

            if (agentData.v_agent_id) {
              setVapiAgentId(agentData.v_agent_id);
            }

            if (agentData.first_message) {
              setFirstMessage(agentData.first_message);
            }

            if (agentData.mermaid_chart) {
              setMermaidChart(agentData.mermaid_chart);
            }

            if (agentData.vapi_knowledge_base_id) {
              setVapiKnowledgeBaseId(agentData.vapi_knowledge_base_id);
            }

            if (agentData.trieve_dataset_id) {
              setTrieveDatasetId(agentData.trieve_dataset_id);
            }
          }
        } catch (error) {
          console.error("Error fetching agent data:", error);
          toast({
            title: "Error",
            description: "Failed to fetch agent data",
            variant: "destructive",
          });
        }
      };

      fetchAgentData();
    }
  }, [open, agentId, refetch]);

  const knowledgeBases = React.useMemo(() => {
    const documents = knowledgeDocuments || [];
    return [
      { id: "none", name: "None" },
      ...documents.map((doc) => ({ id: doc.id, name: doc.title })),
    ];
  }, [knowledgeDocuments]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // If a knowledge base is selected and we don't have a Vapi knowledge base yet, create one
      if (knowledgeBase && knowledgeBase !== "none" && !vapiKnowledgeBaseId) {
        try {
          const result = await createKnowledgeBaseFromDocuments(
            agentId,
            [knowledgeBase],
            {
              searchType: kbSearchType,
              topK: kbTopK,
              scoreThreshold: kbScoreThreshold,
            },
          );

          setVapiKnowledgeBaseId(result.knowledgeBaseId);
          setTrieveDatasetId(result.trieveDatasetId);

          toast({
            title: "Success",
            description:
              "Knowledge base created automatically from uploaded documents",
          });
        } catch (kbError) {
          console.warn(
            "Failed to create knowledge base automatically:",
            kbError,
          );
          toast({
            title: "Warning",
            description:
              "Knowledge documents selected but automatic knowledge base creation failed. You may need to upload documents with Trieve integration.",
            variant: "destructive",
          });
        }
      }

      // Only update fields that exist in the agents table
      const updateData = {
        voice_id: selectedVoice,
        language: language,
        knowledge_ids:
          knowledgeBase && knowledgeBase !== "none" ? [knowledgeBase] : [],
        vapi_knowledge_base_id: vapiKnowledgeBaseId,
        trieve_dataset_id: trieveDatasetId,
      } as any;

      const { error } = await supabase
        .from("agents")
        .update(updateData)
        .eq("id", agentId);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Update Vapi agent if v_agent_id exists
      if (vapiAgentId) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const response = await supabase.functions.invoke(
            "update-vapi-agent",
            {
              body: {
                agent_id: agentId,
                v_agent_id: vapiAgentId,
                voice_id: selectedVoice,
                language: language,
                first_message:
                  firstMessage ||
                  `Hello! This is an AI assistant. How can I help you today?`,
                mermaid_chart: mermaidChart || "",
                max_duration_seconds:
                  loadedAgentData?.max_duration_seconds || 600,
                background_sound: loadedAgentData?.background_sound || "office",
                knowledge_base_id: vapiKnowledgeBaseId,
              },
              headers: { Authorization: `Bearer ${session?.access_token}` },
            },
          );

          if (response.error) {
            console.error("Failed to update voice agent:", response.error);
            toast({
              title: "Warning",
              description:
                "Agent settings saved but voice service update failed. The agent may not reflect all changes.",
              variant: "destructive",
            });
          } else {
            console.log("Voice agent updated successfully");
          }
        } catch (vapiError) {
          console.error("Error updating voice agent:", vapiError);
          toast({
            title: "Warning",
            description:
              "Agent settings saved but voice service update failed. The agent may not reflect all changes.",
            variant: "destructive",
          });
        }
      }

      await onUpdateSettings({
        voiceId: selectedVoice,
        language,
      });

      toast({
        title: "Success",
        description: "Agent settings updated",
      });
      setOpen(false);
    } catch (error) {
      console.error("Error updating agent settings:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update agent settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const previewVoice = async () => {
    if (!audioElement) {
      toast({
        title: "Error",
        description: "Audio player not initialized. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (isPreviewingVoice) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPreviewingVoice(false);
      return;
    }

    try {
      setIsPreviewingVoice(true);

      const voice = voices.find((v) => v.voice_id === selectedVoice);
      const voiceName = voice?.name || "this voice";
      const previewText = `Hello! This is a preview of ${voiceName}. I'm ready to assist you with your needs.`;

      console.log("Generating voice preview for:", voiceName);

      // Use Supabase Edge Function for voice sample
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke(
        "get-elevenlabs-voice-sample",
        {
          body: {
            voice_id: selectedVoice,
            text: previewText,
          },
          headers: { Authorization: `Bearer ${session?.access_token}` },
        },
      );

      if (error) {
        console.error("Voice preview error:", error);
        throw new Error(`Failed to generate voice preview: ${error.message}`);
      }

      if (!data?.audioUrl) {
        throw new Error("No audio URL received from voice preview service");
      }

      // Play the audio from the returned URL
      audioElement.src = data.audioUrl;

      // Clean up when done
      audioElement.onended = () => {
        setIsPreviewingVoice(false);
      };

      // Play the audio
      audioElement.load();
      await audioElement.play();
    } catch (error) {
      console.error("Error previewing voice:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to preview voice. Please check your ElevenLabs configuration.",
        variant: "destructive",
      });
      setIsPreviewingVoice(false);
    }
  };

  const addAcknowledgementPhrase = (phrase: string) => {
    if (phrase.trim() && !acknowledgementPhrases.includes(phrase.trim())) {
      setAcknowledgementPhrases([...acknowledgementPhrases, phrase.trim()]);
    }
  };

  const removeAcknowledgementPhrase = (index: number) => {
    setAcknowledgementPhrases(
      acknowledgementPhrases.filter((_, i) => i !== index),
    );
  };

  const [newPhrase, setNewPhrase] = React.useState("");

  const handleFileUpload = async (files: FileList) => {
    setIsUploadingFile(true);
    try {
      const filePromises = Array.from(files).map(async (file) => {
        const text = await file.text();
        return {
          name: file.name,
          content: text,
          type: file.type || "text/plain",
        };
      });

      const processedFiles = await Promise.all(filePromises);
      setUploadedFiles((prev) => [...prev, ...processedFiles]);

      toast({
        title: "Success",
        description: `Prepared ${processedFiles.length} file(s) for upload`,
      });
    } catch (error) {
      console.error("Error processing files:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to process files",
        variant: "destructive",
      });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const createKnowledgeBase = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one file",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingKnowledgeBase(true);
    try {
      // Step 1: Create Trieve dataset
      const dataset = await createTrieveDataset(
        `${agentId}-knowledge-base`,
        agentId,
      );

      setTrieveDatasetId(dataset.id);

      // Step 2: Upload files to Trieve
      const uploadResult = await uploadToTrieve(dataset.id, uploadedFiles);

      if (!uploadResult.success && uploadResult.status !== 207) {
        throw new Error(
          uploadResult.message || "Failed to upload files to Trieve",
        );
      }

      // Step 3: Create Vapi knowledge base using Trieve dataset
      const kb = await createVapiKnowledgeBase(
        `${agentId}-knowledge-base`,
        dataset.id,
        agentId,
        {
          searchType: kbSearchType,
          topK: kbTopK,
          scoreThreshold: kbScoreThreshold,
        },
      );

      setVapiKnowledgeBaseId(kb.id);
      await updateAgentKnowledgeBase(agentId, kb.id, []);

      toast({
        title: "Success",
        description: "Knowledge base created successfully with Trieve",
      });
    } catch (error) {
      console.error("Error creating knowledge base:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create knowledge base",
        variant: "destructive",
      });
    } finally {
      setIsCreatingKnowledgeBase(false);
    }
  };

  return (
    <TooltipProvider>
      <CustomModal
        open={open}
        onOpenChange={setOpen}
        title="Agent Voice & Behavior"
        description="Configure how your agent sounds and behaves during conversations"
        className="max-w-3xl"
      >
        <div>
          {/* Tab Navigation */}
          <div className="px-6 pt-4 pb-2 border-b">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("voice")}
                className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-all ${
                  activeTab === "voice"
                    ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                Voice
              </button>
              <button
                onClick={() => setActiveTab("behavior")}
                className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-all ${
                  activeTab === "behavior"
                    ? "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-b-2 border-purple-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                Behavior
              </button>
              <button
                onClick={() => setActiveTab("knowledge")}
                className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-all ${
                  activeTab === "knowledge"
                    ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-b-2 border-green-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                Knowledge & Phrases
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="px-6 py-5 min-h-[350px]">
            {/* Voice Settings Tab */}
            {activeTab === "voice" && (
              <section className="space-y-4 animate-in fade-in duration-200">
                <div className="grid gap-4">
                  {/* Voice Selection with Preview */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">
                      Voice
                    </Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedVoice}
                        onValueChange={setSelectedVoice}
                      >
                        <SelectTrigger className="flex-1 h-11 rounded-lg border-input bg-background hover:bg-accent/50 transition-colors">
                          <SelectValue>
                            {(() => {
                              const v = voices.find(
                                (voice) => voice.voice_id === selectedVoice,
                              );
                              if (!v) return null;
                              return (
                                <span className="flex items-center gap-3">
                                  <span className="font-medium">{v.name}</span>
                                </span>
                              );
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          {voices.map((voice) => (
                            <SelectItem
                              key={voice.voice_id}
                              value={voice.voice_id}
                              className="py-2.5 px-3 rounded-md"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-medium">
                                  {voice.name}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="default"
                        disabled
                        title="Voice preview not available - test your agent to hear the voice"
                        className="px-4 h-11 rounded-lg border-input opacity-50 cursor-not-allowed flex items-center gap-2"
                      >
                        {isPreviewingVoice ? (
                          <>
                            <Pause className="h-4 w-4" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            <span>Preview</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">
                      Language
                    </Label>
                    <Select onValueChange={setLanguage} value={language}>
                      <SelectTrigger className="h-11 rounded-lg border-input bg-background hover:bg-accent/50 transition-colors">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg max-h-[300px]">
                        {languages.map((l) => (
                          <SelectItem
                            key={l.id}
                            value={l.id}
                            className="py-2 rounded-md"
                          >
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>
            )}

            {/* Behavior Settings Tab */}
            {activeTab === "behavior" && (
              <section className="space-y-4 animate-in fade-in duration-200">
                <div className="grid gap-4 pl-3">
                  <div className="flex items-center justify-center h-48">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        Coming Soon
                      </h3>
                      <p className="text-muted-foreground">
                        Behavioral features for your agent will be available in
                        a future update.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Knowledge & Phrases Tab */}
            {activeTab === "knowledge" && (
              <section className="space-y-4 animate-in fade-in duration-200">
                <div className="space-y-4">
                  {/* Knowledge Base */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-foreground">
                        Knowledge Base
                      </Label>
                      {vapiKnowledgeBaseId && (
                        <Badge variant="outline" className="text-xs">
                          Knowledge Base Active
                        </Badge>
                      )}
                    </div>

                    {/* Knowledge Base Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">
                        Select Knowledge Base
                      </Label>
                      <Select
                        onValueChange={setKnowledgeBase}
                        value={knowledgeBase}
                      >
                        <SelectTrigger className="h-11 rounded-lg border-input bg-background hover:bg-accent/50 transition-colors">
                          <SelectValue placeholder="Select knowledge base" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg max-h-[300px]">
                          {knowledgeBases.map((kb) => (
                            <SelectItem
                              key={kb.id}
                              value={kb.id}
                              className="py-2 rounded-md"
                            >
                              {kb.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Enhanced Footer */}
        <CustomModalFooter>
          <div className="flex gap-3 w-full justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-10 px-5 rounded-lg hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CustomModalFooter>
      </CustomModal>
    </TooltipProvider>
  );
}
