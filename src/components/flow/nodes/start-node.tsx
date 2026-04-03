import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useContext } from "react";
import {
  PlayCircle,
  Zap,
  MessageCirclePlus,
  Plus,
  Pencil,
  X as CloseIcon,
  AlertTriangle,
  PhoneIncoming,
  Facebook,
  Edit3 as DraftIcon,
} from "lucide-react";
import { NodeUpdateContext } from "@/components/flow/agent-flow/node-update-context";
import { GreetingInput } from "./greeting/greeting-input";
import { NodeAction } from "@/types/agent-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DUMMY_PHONE_NUMBERS = [
  "+1 (555) 123-4567",
  "+1 (555) 234-5678",
  "+1 (555) 345-6789",
  "+1 (555) 456-7890",
];

type StartNodeData = {
  firstMessage: string;
  outcomes?: string[];
  actions?: NodeAction[];
  speakerInitiative?: "agent" | "human";
  triggerType?: string;
  triggerConfig?: {
    phoneNumber?: string;
  };
};

export function StartNode({ data, id }: { data: StartNodeData; id: string }) {
  const { updateNodeData } = useContext(NodeUpdateContext);
  const initialMessage =
    typeof data.firstMessage === "string" ? data.firstMessage : "<p></p>";
  const [firstMessage, setFirstMessage] = useState(initialMessage);
  const [speakerInitiative, setSpeakerInitiative] = useState<"agent" | "human">(
    data.speakerInitiative || "agent",
  );

  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [newOutcome, setNewOutcome] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [outcomes, setOutcomes] = useState(data.outcomes || []);

  const [actions, setActions] = useState<NodeAction[]>(data.actions || []);
  const [triggerType, setTriggerType] = useState<string | undefined>(
    data.triggerType,
  );
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<
    string | undefined
  >(data.triggerConfig?.phoneNumber);
  const [isEditingTrigger, setIsEditingTrigger] = useState(false);

  const { getEdges, setEdges } = useReactFlow();

  useEffect(() => {
    const currentPhoneNumberInConfig = data.triggerConfig?.phoneNumber;
    const hasDataChanged =
      firstMessage !== data.firstMessage ||
      speakerInitiative !== data.speakerInitiative ||
      triggerType !== data.triggerType ||
      (triggerType === "phone_call" &&
        selectedPhoneNumber !== currentPhoneNumberInConfig) ||
      (triggerType !== "phone_call" &&
        currentPhoneNumberInConfig !== undefined); // Ensure config is cleared if not phone_call

    if (hasDataChanged) {
      const newTriggerConfig = { ...data.triggerConfig };
      if (triggerType === "phone_call") {
        newTriggerConfig.phoneNumber = selectedPhoneNumber;
      } else {
        delete newTriggerConfig.phoneNumber;
      }

      updateNodeData(id, {
        ...data,
        firstMessage,
        speakerInitiative,
        triggerType,
        triggerConfig: newTriggerConfig,
      });
    }
  }, [
    firstMessage,
    speakerInitiative,
    triggerType,
    selectedPhoneNumber,
    data,
    id,
    updateNodeData,
  ]);

  useEffect(() => {
    setOutcomes(data.outcomes || []);
    setActions(data.actions || []);
    if (data.speakerInitiative) {
      setSpeakerInitiative(data.speakerInitiative);
    }
    if (data.triggerType) {
      setTriggerType(data.triggerType);
    }
    if (data.triggerType === "phone_call" && data.triggerConfig?.phoneNumber) {
      setSelectedPhoneNumber(data.triggerConfig.phoneNumber);
    } else if (data.triggerType !== "phone_call") {
      setSelectedPhoneNumber(undefined);
    }
  }, [
    data.outcomes,
    data.actions,
    data.speakerInitiative,
    data.triggerType,
    data.triggerConfig,
  ]);

  const handleFirstMessageChange = (value: string) => {
    setFirstMessage(value);
  };

  const addOutcome = () => {
    if (outcomes.length >= 5 || !newOutcome.trim()) return;
    if (outcomes.length === 0) {
      const currentEdges = getEdges();
      const defaultEdge = currentEdges.find(
        (edge) => edge.source === id && edge.sourceHandle === "default",
      );
      if (defaultEdge) {
        setEdges((eds) => eds.filter((edge) => edge.id !== defaultEdge.id));
      }
    }
    const newOutcomesArray = [...outcomes, newOutcome];
    setOutcomes(newOutcomesArray);
    updateNodeData(id, {
      ...data,
      firstMessage,
      outcomes: newOutcomesArray,
      actions,
      triggerType,
      triggerConfig: data.triggerConfig,
    });
    setNewOutcome("");
    setShowOutcomeDialog(false);
  };

  const removeOutcome = (index: number) => {
    const newOutcomesArray = outcomes.filter((_, i) => i !== index);
    setOutcomes(newOutcomesArray);
    updateNodeData(id, {
      ...data,
      firstMessage,
      outcomes: newOutcomesArray,
      actions,
      triggerType,
      triggerConfig: data.triggerConfig,
    });
  };

  const startEditingOutcome = (index: number) => {
    setEditingIndex(index);
    setNewOutcome(outcomes[index]);
    setShowOutcomeDialog(true);
  };

  const saveEditOutcome = () => {
    if (!newOutcome.trim() || editingIndex === null) return;
    const updatedOutcomesArray = [...outcomes];
    updatedOutcomesArray[editingIndex] = newOutcome;
    setOutcomes(updatedOutcomesArray);
    updateNodeData(id, {
      ...data,
      firstMessage,
      outcomes: updatedOutcomesArray,
      actions,
      triggerType,
      triggerConfig: data.triggerConfig,
    });
    setEditingIndex(null);
    setNewOutcome("");
    setShowOutcomeDialog(false);
  };

  const cancelEditOutcome = () => {
    setShowOutcomeDialog(false);
    setEditingIndex(null);
    setNewOutcome("");
  };

  const openNewOutcomeDialog = () => {
    setEditingIndex(null);
    setNewOutcome("");
    setShowOutcomeDialog(true);
  };

  const handleOutcomeDialogKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (editingIndex !== null) saveEditOutcome();
      else addOutcome();
    }
  };

  const openTriggerDialog = () => {
    setIsEditingTrigger(!isEditingTrigger);
  };

  const handleSelectTriggerType = (newTriggerType: string) => {
    setTriggerType(newTriggerType);
    let newPhoneNumber = selectedPhoneNumber;

    if (newTriggerType === "manual") {
      newPhoneNumber = undefined;
      setIsEditingTrigger(false);
    } else if (newTriggerType !== "phone_call") {
      newPhoneNumber = undefined;
      setIsEditingTrigger(false);
    } else {
      setIsEditingTrigger(true);
    }
    setSelectedPhoneNumber(newPhoneNumber);
    updateNodeData(id, {
      ...data,
      triggerType: newTriggerType,
      triggerConfig: { ...data.triggerConfig, phoneNumber: newPhoneNumber },
    });
  };

  const handlePhoneNumberSelect = (phoneNumberValue: string) => {
    setSelectedPhoneNumber(phoneNumberValue);
    updateNodeData(id, {
      ...data,
      triggerConfig: { ...data.triggerConfig, phoneNumber: phoneNumberValue },
    });
    setIsEditingTrigger(false);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="group relative isolate">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-purple-300/60 dark:border-purple-800/60 shadow-[0_8px_16px_-6px_rgba(168,85,247,0.18)] dark:shadow-[0_8px_16px_-6px_rgba(168,85,247,0.28)] p-5 min-w-[320px] max-w-[320px] transition-all duration-500 hover:translate-y-[-2px] hover:shadow-[0_20px_40px_-12px_rgba(168,85,247,0.25)] dark:hover:shadow-[0_20px_40px_-12px_rgba(168,85,247,0.35)]">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <span className="relative flex h-8 w-8 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-lg bg-purple-400 opacity-20" />
                <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg">
                  <PlayCircle className="h-4 w-4" />
                </span>
              </span>
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
                Start
              </span>
            </div>
            {triggerType && (
              <div className="text-xs text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-md flex items-center gap-1 max-w-[180px] truncate">
                <Zap className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {triggerType === "phone_call"
                    ? selectedPhoneNumber || "Incoming Call"
                    : triggerType === "facebook_lead"
                      ? "Facebook Lead"
                      : triggerType === "manual"
                        ? "Draft"
                        : "Set Trigger"}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-2 mb-3 w-full mt-3">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              First Message
            </Label>
            <GreetingInput
              value={firstMessage}
              onChange={handleFirstMessageChange}
            />
          </div>

          {isEditingTrigger && (
            <div className="mt-4 pt-4 border-t border-purple-200/30 dark:border-purple-800/30 animate-fade-in">
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3 block">
                This AI will automatically run when...
              </Label>
              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={
                        triggerType === "phone_call" ? "default" : "outline"
                      }
                      size="sm"
                      className={`w-full justify-start gap-2 text-sm h-auto py-2 px-3 transition-all mb-1
                                  ${
                                    triggerType === "phone_call"
                                      ? "bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600 dark:text-white border-purple-600 dark:border-purple-500"
                                      : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                  }`}
                      onClick={() => handleSelectTriggerType("phone_call")}
                    >
                      <PhoneIncoming
                        className={`h-4 w-4 ${triggerType === "phone_call" ? "text-white dark:text-white" : "text-sky-500"}`}
                      />
                      <span>Someone calls a specific number</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    align="start"
                    className="max-w-xs"
                  >
                    <p>AI starts when a chosen phone number receives a call.</p>
                  </TooltipContent>
                </Tooltip>
                {triggerType === "phone_call" && (
                  <div className="pl-1 pr-1 mt-1 mb-2 animate-fade-in">
                    <Select
                      onValueChange={handlePhoneNumberSelect}
                      value={selectedPhoneNumber || ""}
                    >
                      <SelectTrigger className="w-full h-9 text-xs bg-white/80 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600 focus:ring-purple-500 dark:focus:ring-purple-400">
                        <SelectValue placeholder="Select a phone number..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
                        {DUMMY_PHONE_NUMBERS.map((num) => (
                          <SelectItem
                            key={num}
                            value={num}
                            className="text-xs focus:bg-purple-100 dark:focus:bg-purple-800/50"
                          >
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={
                        triggerType === "facebook_lead" ? "default" : "outline"
                      }
                      size="sm"
                      className={`w-full justify-start gap-2 text-sm h-auto py-2 px-3 transition-all
                                  ${
                                    triggerType === "facebook_lead"
                                      ? "bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600 dark:text-white border-purple-600 dark:border-purple-500"
                                      : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                  }`}
                      onClick={() => handleSelectTriggerType("facebook_lead")}
                    >
                      <Facebook
                        className={`h-4 w-4 ${triggerType === "facebook_lead" ? "text-white dark:text-white" : "text-blue-600"}`}
                      />
                      <span>A new lead comes in from Facebook</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    align="start"
                    className="max-w-xs"
                  >
                    <p>
                      AI starts when a new lead is captured from Facebook Ads.
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={triggerType === "manual" ? "default" : "outline"}
                      size="sm"
                      className={`w-full justify-start gap-2 text-sm h-auto py-2 px-3 transition-all
                                  ${
                                    triggerType === "manual"
                                      ? "bg-slate-600 hover:bg-slate-700 text-white dark:bg-slate-500 dark:hover:bg-slate-600 dark:text-white border-slate-600 dark:border-slate-500"
                                      : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                  }`}
                      onClick={() => handleSelectTriggerType("manual")}
                    >
                      <DraftIcon
                        className={`h-4 w-4 ${triggerType === "manual" ? "text-white dark:text-white" : "text-slate-500"}`}
                      />
                      <span>Don't run automatically</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    align="start"
                    className="max-w-xs"
                  >
                    <p>
                      AI only starts when you test or run it manually. It won't
                      activate on its own.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}

          {outcomes.length > 0 && !isEditingTrigger && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-purple-600/75 dark:text-purple-300/75">
                  Outcomes ({outcomes.length}/5)
                </Label>
                {outcomes.length < 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-900/50 rounded-lg"
                    onClick={openNewOutcomeDialog}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {outcomes.map((outcome, index) => (
                  <div key={index} className="group relative animate-fade-in">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 backdrop-blur-sm bg-white/40 dark:bg-gray-900/40 rounded-xl py-2.5 px-4 text-sm border border-purple-100/50 dark:border-purple-800/50 shadow-sm text-gray-900 dark:text-white/90 overflow-hidden">
                        <div className="truncate">{outcome}</div>
                      </div>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 bg-white/80 dark:bg-gray-900/80 shadow-sm hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-lg"
                          onClick={() => startEditingOutcome(index)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 bg-white/80 dark:bg-gray-900/80 shadow-sm hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg"
                          onClick={() => removeOutcome(index)}
                        >
                          <CloseIcon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Handle
                        type="source"
                        position={Position.Right}
                        id={`outcome-${index}`}
                        className="!w-2 !h-4 !bg-purple-400 rounded-sm border-none !right-[-8px] transition-all duration-300 hover:!bg-purple-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Removed Trigger and Add Outcome buttons from below the start node */}

        {(!outcomes || outcomes.length === 0) && (
          <Handle
            type="source"
            position={Position.Right}
            id="default"
            className="!w-2 !h-4 !bg-purple-400 rounded-sm border-none !right-[-8px] transition-all duration-300 hover:!bg-purple-500"
          />
        )}

        <Dialog open={showOutcomeDialog} onOpenChange={setShowOutcomeDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>
                {editingIndex !== null ? "Edit Outcome" : "Add Outcome"}
              </DialogTitle>
              <DialogDescription>
                What might the caller say at this point?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <Input
                value={newOutcome}
                onChange={(e) => setNewOutcome(e.target.value)}
                placeholder="e.g., I'd like to learn about pricing"
                onKeyDown={handleOutcomeDialogKeyDown}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Use specific responses, not generic ones like "Yes" or "No".
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={cancelEditOutcome}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  editingIndex !== null ? saveEditOutcome() : addOutcome()
                }
                disabled={!newOutcome.trim() || newOutcome.trim().length < 3}
              >
                {editingIndex !== null ? "Save" : "Add"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
