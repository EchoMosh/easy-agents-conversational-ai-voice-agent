import { Handle, Position } from "@xyflow/react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Plus,
  MessageSquare,
  Pencil,
  X,
  Send,
  AlertTriangle,
  Webhook,
  Mail,
  MessageCirclePlus,
} from "lucide-react";
import { useState, useEffect, useContext } from "react";
import { GreetingInput } from "./greeting/greeting-input";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { NodeAction, NodeData } from "@/types/agent-types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NodeUpdateContext } from "@/components/flow/agent-flow/node-update-context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useReactFlow } from "@xyflow/react";
import { ComingSoonDialog } from "./coming-soon-dialog";

type GreetingNodeData = {
  greeting: string;
  outcomes?: string[];
  actions?: NodeAction[];
};

export function GreetingNode({
  data,
  id,
}: {
  data: GreetingNodeData;
  id: string;
}) {
  const { updateNodeData } = useContext(NodeUpdateContext);
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [showComingSoonDialog, setShowComingSoonDialog] = useState(false);
  const [newOutcome, setNewOutcome] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [greeting, setGreeting] = useState(data.greeting);
  const [outcomes, setOutcomes] = useState(data.outcomes || []);
  const [actions, setActions] = useState<NodeAction[]>(data.actions || []);
  const { getEdges, setEdges } = useReactFlow();

  useEffect(() => {
    setOutcomes(data.outcomes || []);
    setActions(data.actions || []);
  }, [data.outcomes, data.actions]);

  useEffect(() => {
    if (greeting !== data.greeting) {
      console.log("Emitting node update for greeting change:", greeting);
      updateNodeData(id, {
        ...data,
        greeting,
      });
    }
  }, [greeting, id, data, updateNodeData]);

  const addOutcome = () => {
    if (outcomes.length >= 5) return;
    if (!newOutcome.trim()) return;

    if (outcomes.length === 0) {
      removeDefaultEdge();
    }

    const newOutcomes = [...outcomes, newOutcome];
    setOutcomes(newOutcomes);
    setNewOutcome("");
    setShowOutcomeDialog(false);

    updateNodeData(id, {
      ...data,
      outcomes: newOutcomes,
    });
  };

  const removeDefaultEdge = () => {
    const edges = getEdges();
    const defaultEdges = edges.filter(
      (edge) => edge.source === id && edge.sourceHandle === "default",
    );

    if (defaultEdges.length > 0) {
      console.log(
        `Removing default edge(s) from node ${id} as outcomes are being added`,
      );
      const remainingEdges = edges.filter(
        (edge) => !(edge.source === id && edge.sourceHandle === "default"),
      );
      setEdges(remainingEdges);
    }
  };

  const removeOutcome = (index: number) => {
    const newOutcomes = outcomes.filter((_, i) => i !== index);
    setOutcomes(newOutcomes);

    updateNodeData(id, {
      ...data,
      outcomes: newOutcomes,
    });
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setNewOutcome(outcomes[index]);
    setShowOutcomeDialog(true);
  };

  const saveEdit = () => {
    if (!newOutcome.trim() || editingIndex === null) return;
    const updatedOutcomes = [...outcomes];
    updatedOutcomes[editingIndex] = newOutcome;
    setOutcomes(updatedOutcomes);
    setEditingIndex(null);
    setNewOutcome("");
    setShowOutcomeDialog(false);

    updateNodeData(id, {
      ...data,
      outcomes: updatedOutcomes,
    });
  };

  const cancelEdit = () => {
    setShowOutcomeDialog(false);
    setEditingIndex(null);
    setNewOutcome("");
  };

  const openNewOutcomeDialog = () => {
    setEditingIndex(null);
    setNewOutcome("");
    setShowOutcomeDialog(true);
  };

  const handleGreetingChange = (value: string) => {
    setGreeting(value);
  };

  const openComingSoonDialog = () => {
    setShowComingSoonDialog(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (editingIndex !== null) {
        saveEdit();
      } else {
        addOutcome();
      }
    }
  };

  return (
    <div className="group relative isolate">
      {/* glow div removed — filter:blur(24px) per node was a massive paint cost */}

      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 shadow-[0_8px_16px_-6px_rgba(59,130,246,0.2)] dark:shadow-[0_8px_16px_-6px_rgba(59,130,246,0.3)] p-5 min-w-[320px] max-w-[320px] transition-shadow duration-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="relative flex h-8 w-8 items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-lg bg-blue-400 opacity-20" />
            <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-sky-500 text-white shadow-lg">
              <MessageSquare className="h-4 w-4" />
            </span>
          </span>
          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-sky-500">
            Speak
          </span>
        </div>

        <div className="space-y-2 mb-6 w-full">
          <Label className="text-xs font-medium text-blue-600/75 dark:text-blue-300/75">
            Message
          </Label>
          <GreetingInput value={greeting} onChange={handleGreetingChange} />
        </div>

        {outcomes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-blue-600/75 dark:text-blue-300/75">
                Possible outcomes ({outcomes.length}/5)
              </Label>
              {outcomes.length < 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg"
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
                    <div className="flex-1 bg-white/40 dark:bg-gray-900/40 rounded-xl py-2.5 px-4 text-sm border border-blue-100/50 dark:border-blue-800/50 shadow-sm text-gray-900 dark:text-white/90 overflow-hidden">
                      <div className="truncate">{outcome}</div>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-white/80 dark:bg-gray-900/80 shadow-sm hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg"
                        onClick={() => startEditing(index)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-white/80 dark:bg-gray-900/80 shadow-sm hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg"
                        onClick={() => removeOutcome(index)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={`outcome-${index}`}
                      className="!w-2 !h-4 !bg-blue-400 rounded-sm border-none !right-[-8px] transition-all duration-300 hover:!bg-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Button
          onClick={openComingSoonDialog}
          className="flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors shadow-md rounded-full border border-blue-200/50 dark:border-blue-800/50 my-[9px]"
        >
          <Send className="h-3 w-3 text-blue-600/80 dark:text-blue-400/80" />
          <span className="text-xs font-medium text-blue-600/80 dark:text-blue-400/80">
            Actions {actions.length > 0 && `(${actions.length})`}
          </span>
        </Button>

        <Button
          onClick={openNewOutcomeDialog}
          className="flex items-center justify-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors shadow-md rounded-full border border-purple-200/50 dark:border-purple-800/50 my-[9px]"
        >
          <MessageCirclePlus className="h-3 w-3 text-purple-600/80 dark:text-purple-400/80" />
          <span className="text-xs font-medium text-purple-600/80 dark:text-purple-400/80">
            Add Outcome
          </span>
        </Button>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-4 !bg-blue-400 rounded-sm border-none !left-[-8px] transition-all duration-300 hover:!bg-blue-500"
      />

      {(!outcomes || outcomes.length === 0) && (
        <Handle
          type="source"
          position={Position.Right}
          id="default"
          className="!w-2 !h-4 !bg-blue-400 rounded-sm border-none !right-[-8px] transition-all duration-300 hover:!bg-blue-500"
        />
      )}

      <Dialog open={showOutcomeDialog} onOpenChange={setShowOutcomeDialog}>
        <DialogContent className="sm:max-w-[800px] p-0 gap-0 border-0 shadow-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {editingIndex !== null ? "Edit Outcome" : "Add New Outcome"}
              </DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-gray-400 mt-2 text-base">
                Create specific outcomes that represent different user response
                paths
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-start gap-3 rounded-lg border border-amber-100 dark:border-amber-900/30 bg-gradient-to-r from-amber-50/70 to-amber-50/30 dark:from-amber-900/10 dark:to-amber-900/5 p-4 animate-fade-in">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-medium text-amber-800 dark:text-amber-400 text-sm">
                  Avoid creating multiple similar outcomes
                </h4>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/70">
                  Create only distinct outcomes even if your agent asks for
                  multiple options. Focus on key decision points rather than
                  every possible response.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="rounded-xl border border-red-100 dark:border-red-900/30 bg-gradient-to-r from-red-50/70 to-red-50/30 dark:from-red-900/10 dark:to-red-900/5 p-4">
                <p className="font-medium text-red-600 dark:text-red-400 text-sm mb-2">
                  Not recommended:
                </p>
                <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-400 dark:bg-red-500 mt-1.5 flex-shrink-0"></div>
                    <span>Generic responses ("Yes"/"No")</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-400 dark:bg-red-500 mt-1.5 flex-shrink-0"></div>
                    <span>
                      Very similar options ("I agree"/"I'm interested")
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-400 dark:bg-red-500 mt-1.5 flex-shrink-0"></div>
                    <span>Too many specific variations</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-xl border border-green-100 dark:border-green-900/30 bg-gradient-to-r from-green-50/70 to-green-50/30 dark:from-green-900/10 dark:to-green-900/5 p-4">
                <p className="font-medium text-green-600 dark:text-green-400 text-sm mb-2">
                  Recommended:
                </p>
                <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 dark:bg-green-500 mt-1.5 flex-shrink-0"></div>
                    <span>"I'd like to learn about pricing options"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 dark:bg-green-500 mt-1.5 flex-shrink-0"></div>
                    <span>"I'm interested in the sedan model"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 dark:bg-green-500 mt-1.5 flex-shrink-0"></div>
                    <span>"I want to speak with a representative"</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <Label
                htmlFor="outcome-input"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
              >
                Outcome
              </Label>
              <Input
                id="outcome-input"
                value={newOutcome}
                onChange={(e) => setNewOutcome(e.target.value)}
                placeholder="Enter a detailed user response..."
                className="text-base border-gray-200 dark:border-gray-700 h-12 px-4 rounded-lg focus-visible:ring-purple-500"
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-800/20">
            <Button
              variant="outline"
              onClick={cancelEdit}
              className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-5"
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white transition-all duration-200 shadow-md hover:shadow-lg rounded-lg px-5"
              onClick={() =>
                editingIndex !== null ? saveEdit() : addOutcome()
              }
              disabled={!newOutcome.trim() || newOutcome.trim().length < 5}
            >
              {editingIndex !== null ? "Save Changes" : "Add Outcome"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ComingSoonDialog
        open={showComingSoonDialog}
        onOpenChange={setShowComingSoonDialog}
        feature="Actions"
      />
    </div>
  );
}
