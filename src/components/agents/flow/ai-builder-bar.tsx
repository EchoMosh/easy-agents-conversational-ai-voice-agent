import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * AI Builder Command Bar (spec-driven light bar)
 * Implements the user's JSON spec:
 * - Container: height 48, white bg, top border, subtle top shadow, padding 4px 16px
 * - Text field: 40px height, calc(100% - 56px) width, #F5F5F5 bg, no border, 12px radius, 0 16px padding,
 *               font-size 14, #333 color, placeholder "What do you want to change?",
 *               focus: white bg + 1px #007AFF border, no outline
 * - Send button: icon-only paper plane, 32px, transparent, no border, pointer; disabled opacity 0.5;
 *                hover scale 1.1 with 0.1s ease-in-out transition
 * Behavior:
 * - Immediate apply; no preview or logs.
 * - Heuristics + slash commands to determine action.
 * - Cmd/Ctrl + / focuses the input.
 */

type BuilderIntent = "generate" | "modify" | "explain" | "validate";

export interface AIBuilderBarProps {
  className?: string;
  onGenerate?: (prompt: string) => void;
  onModifySelection?: (prompt: string) => void;
  onExplainSelection?: () => void;
  onValidate?: () => void;
}

export const AIBuilderBar: React.FC<AIBuilderBarProps> = ({
  className,
  onGenerate,
  onModifySelection,
  onExplainSelection,
  onValidate,
}) => {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard: focus omnibar with Cmd/Ctrl + /
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().includes("MAC");
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Heuristics/slash commands
  const effectiveIntent: BuilderIntent = useMemo(() => {
    const text = prompt.trim().toLowerCase();

    if (text.startsWith("/")) {
      if (text.startsWith("/generate")) return "generate";
      if (text.startsWith("/modify")) return "modify";
      if (text.startsWith("/explain")) return "explain";
      if (text.startsWith("/validate")) return "validate";
    }

    if (/\b(validate|preflight|check|errors?|issues?|lint)\b/.test(text)) return "validate";
    if (/\b(explain|why|how|what does|describe|understand)\b/.test(text)) return "explain";
    if (/\b(change|edit|update|insert|add|remove|delete|modify|replace|branch)\b/.test(text)) return "modify";
    return "generate";
  }, [prompt]);

  // Apply immediately (no preview, no logs)
  const submit = useCallback(async () => {
    if (isSubmitting) return;

    const needsText = effectiveIntent === "generate" || effectiveIntent === "modify";
    const text = prompt.replace(/^\/\w+\s*/i, "").trim();
    if (needsText && !text) return;

    setIsSubmitting(true);
    try {
      if (effectiveIntent === "generate") {
        if (text && onGenerate) onGenerate(text);
      } else if (effectiveIntent === "modify") {
        if (text && onModifySelection) onModifySelection(text);
      } else if (effectiveIntent === "explain") {
        if (onExplainSelection) onExplainSelection();
      } else if (effectiveIntent === "validate") {
        if (onValidate) onValidate();
      }
      setPrompt("");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, prompt, effectiveIntent, onGenerate, onModifySelection, onExplainSelection, onValidate]);

  return (
    <div
      className={cn("fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto", className)}
      aria-live="polite"
      aria-relevant="additions removals"
    >
      <div
        className="flex items-center gap-3 h-12 w-full rounded-2xl transition-all duration-200"
        style={{
          height: 68,
          width: "860px",
          backgroundColor: "rgba(255,255,255,0.95)",
          border: "1px solid #E6E8EC",
          boxShadow: focused ? "0 12px 32px rgba(16,24,40,0.16), 0 4px 12px rgba(16,24,40,0.08)" : "0 8px 24px rgba(16,24,40,0.12), 0 2px 8px rgba(16,24,40,0.06)",
          padding: "4px 16px",
          backdropFilter: "blur(8px)",
          transform: focused ? "translateY(-2px)" : "translateY(0)"
        }}
      >
        <Input
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="What do you want to change?"
          style={{
            height: 40,
            flex: "1 1 auto",
            backgroundColor: "#F5F5F5",
            border: "none",
            borderRadius: 12,
            padding: "0 16px",
            fontSize: 14,
            color: "#333333",
          }}
          className={cn(
            // remove default rings/outlines, apply spec focus styles
            "focus:outline-none focus:ring-0 focus-visible:ring-0",
            "focus:bg-white"
          )}
        />

        <Button
          onClick={submit}
          disabled={
            isSubmitting ||
            ((effectiveIntent === "generate" || effectiveIntent === "modify") &&
              !prompt.replace(/^\/\w+\s*/i, "").trim())
          }
          className={cn(
            "p-0 h-8 w-8 rounded-full border-0",
            "bg-transparent hover:bg-transparent active:bg-transparent",
            "transition-transform duration-100 ease-in-out",
            "hover:scale-110",
            "disabled:opacity-50 disabled:cursor-default"
          )}
          title="Send"
        >
          <Send className="h-8 w-8 text-[#007AFF]" />
        </Button>
      </div>
    </div>
  );
};

export default AIBuilderBar;
