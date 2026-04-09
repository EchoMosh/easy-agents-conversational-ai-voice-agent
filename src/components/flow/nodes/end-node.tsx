import { Handle, Position } from "@xyflow/react";
import { X } from "lucide-react";
import { useState, useContext } from "react";
import { NodeUpdateContext } from "@/components/flow/agent-flow/node-update-context";
import { GreetingInput } from "./greeting/greeting-input"; // Use the same component as Greeting node

export function EndNode({
  id,
  data,
}: {
  id: string;
  data: { message?: string };
}) {
  // Ensure initial value is a string, defaulting to an empty paragraph for TipTap
  const initialMessageValue =
    typeof data?.message === "string" ? data.message : "<p></p>";
  const [message, setMessage] = useState(initialMessageValue);
  const { updateNodeData } = useContext(NodeUpdateContext);

  const handleMessageChange = (value: string) => {
    setMessage(value);
    updateNodeData(id, { message: value });
  };

  return (
    <div className="group relative">
      {/* Glowing background effect */}
      {/* glow div removed — filter:blur(24px) per node was a massive paint cost */}

      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-rose-200/50 dark:border-rose-800/50 shadow-[0_8px_16px_-6px_rgba(225,29,72,0.2)] dark:shadow-[0_8px_16px_-6px_rgba(225,29,72,0.3)] p-5 min-w-[320px] max-w-[320px] transition-shadow duration-200">
        <div className="flex items-center gap-3 mb-3">
          <span className="relative flex h-8 w-8 items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-lg bg-rose-400 opacity-20" />
            <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg">
              <X className="h-4 w-4" />
            </span>
          </span>
          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">
            End Conversation
          </span>
        </div>

        <div className="mt-2">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            End Call Message
          </label>
          <GreetingInput value={message} onChange={handleMessageChange} />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {" "}
            {/* Increased margin-top for spacing */}
            Assistant will say this message before ending the call.
          </p>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-4 !bg-rose-400 rounded-sm border-none !left-[-8px] transition-all duration-300 hover:!bg-rose-500"
      />
    </div>
  );
}
