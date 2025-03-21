import { Mail, Phone, Send, StickyNote, Smile, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import useChatStore from "@/hooks/use-chat-store";
import { v4 as uuidv4 } from "uuid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "./rich-text-editor";
import { EditorToolbar } from "./editor-toolbar";
import { useEditor } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Placeholder from "@tiptap/extension-placeholder";
import { UnderlineExtension } from "./extensions/underline-extension";
import Link from "@tiptap/extension-link";

interface MessageComposerProps {
  messageType: "email" | "sms" | "note";
  onMessageTypeChange: (type: "email" | "sms" | "note") => void;
  leadId: string;
}

export function MessageComposer({
  messageType,
  onMessageTypeChange,
  leadId,
}: MessageComposerProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailCC, setEmailCC] = useState("");
  const [emailBCC, setEmailBCC] = useState("");
  const queryClient = useQueryClient();
  const { addMessage } = useChatStore();

  // Create a Tiptap editor instance
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      UnderlineExtension,
      BulletList.configure({
        HTMLAttributes: {
          class: "bullet-list",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "ordered-list",
        },
      }),
      ListItem,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder:
          messageType === "email"
            ? "Write your email..."
            : messageType === "sms"
            ? "Write your SMS..."
            : "Add a note...",
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      setMessage(editor.getHTML());
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        // Add keyboard shortcuts for bullet and ordered lists
        if (
          event.key === "8" &&
          event.shiftKey &&
          (event.metaKey || event.ctrlKey)
        ) {
          // Cmd/Ctrl+Shift+8 for bullet list
          editor?.chain().focus().toggleBulletList().run();
          return true;
        }
        if (
          event.key === "7" &&
          event.shiftKey &&
          (event.metaKey || event.ctrlKey)
        ) {
          // Cmd/Ctrl+Shift+7 for ordered list
          editor?.chain().focus().toggleOrderedList().run();
          return true;
        }
        return false;
      },
    },
  });

  // Reset editor content when message type changes
  useEffect(() => {
    if (editor) {
      editor.commands.setContent("");
      setTimeout(() => {
        editor.commands.focus();
      }, 10);
    }
  }, [messageType, editor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsLoading(true);

    try {
      // Get the current authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("No authenticated user found");
        return;
      }

      // First add a message to local state so UI updates immediately
      const newMessage = {
        id: uuidv4(),
        leadId,
        content: message,
        type: messageType,
        createdAt: new Date().toISOString(),
        userId: user.id,
        userName: user.email?.split("@")[0] || "User",
        userAvatar: user.user_metadata?.avatar_url,
        metadata:
          messageType === "email"
            ? {
                subject: emailSubject,
                cc: emailCC,
                bcc: emailBCC,
              }
            : undefined,
      };

      addMessage(newMessage);

      // Then save to database based on message type
      if (messageType === "note") {
        const { error } = await supabase.from("lead_notes").insert({
          lead_id: leadId,
          content: message,
          user_id: user.id,
        });

        if (error) {
          console.error("Error adding note:", error);
          return;
        }
      } else if (messageType === "email") {
        // TODO: Implement email sending
        console.log(
          "Sending email:",
          message,
          "Subject:",
          emailSubject,
          "CC:",
          emailCC,
          "BCC:",
          emailBCC
        );
        // Simulate a delay for email sending
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else if (messageType === "sms") {
        // TODO: Implement SMS sending
        console.log("Sending SMS:", message);
        // Simulate a delay for SMS sending
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Invalidate queries to ensure data is refreshed
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["lead_notes", leadId] }),
        queryClient.invalidateQueries({
          queryKey: ["lead_activities", leadId],
        }),
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
      ]);

      // Clear the input
      setMessage("");
      if (editor) {
        editor.commands.setContent("");
      }

      if (messageType === "email") {
        setEmailSubject("");
        setEmailCC("");
        setEmailBCC("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Email header section with Subject, CC, and BCC on the same line
  const renderEmailHeader = () => {
    if (messageType !== "email") return null;

    return (
      <div className="flex flex-wrap gap-2 items-center py-2">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Label htmlFor="subject" className="text-xs whitespace-nowrap">
            Subject:
          </Label>
          <Input
            id="subject"
            type="text"
            placeholder="Email subject"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            className="h-7 text-sm py-1"
          />
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <Label htmlFor="cc" className="text-xs whitespace-nowrap">
            CC:
          </Label>
          <Input
            id="cc"
            type="text"
            placeholder="email@example.com"
            value={emailCC}
            onChange={(e) => setEmailCC(e.target.value)}
            className="h-7 text-sm py-1"
          />
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <Label htmlFor="bcc" className="text-xs whitespace-nowrap">
            BCC:
          </Label>
          <Input
            id="bcc"
            type="text"
            placeholder="email@example.com"
            value={emailBCC}
            onChange={(e) => setEmailBCC(e.target.value)}
            className="h-7 text-sm py-1"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="border-t p-2">
      <form id="message-form" onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-center justify-between">
          <ToggleGroup
            type="single"
            value={messageType}
            onValueChange={(v) =>
              onMessageTypeChange(v as "email" | "sms" | "note")
            }
            className="justify-start"
          >
            <ToggleGroupItem value="email" aria-label="Email">
              <Mail className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="sms" aria-label="SMS">
              <Phone className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="note" aria-label="Note">
              <StickyNote className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {renderEmailHeader()}

        <div className="relative">
          <div
            className={cn(
              "border rounded-md bg-background flex flex-col",
              messageType === "email" ? "min-h-[120px]" : "min-h-[80px]"
            )}
          >
            {/* Toolbar */}
            {messageType === "email" && (
              <div className="border-b px-2 py-1">
                <EditorToolbar
                  editor={editor}
                  showSmileButton={false}
                  showAttachButton={true}
                  onAttachClick={() => {
                    // Create a file input element
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept =
                      "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
                    input.multiple = false;

                    // Handle file selection
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        // For now, just insert the file name as a placeholder
                        // In a real app, you would upload the file and insert a link or preview
                        editor
                          ?.chain()
                          .focus()
                          .insertContent(`[Attachment: ${file.name}]`)
                          .run();
                      }
                    };

                    // Trigger the file dialog
                    input.click();
                  }}
                />
              </div>
            )}

            {/* Editor */}
            <div className="flex-1 relative">
              <RichTextEditor
                editor={editor}
                value={message}
                onChange={setMessage}
                placeholder={
                  messageType === "email"
                    ? "Write your email..."
                    : messageType === "sms"
                    ? "Write your SMS..."
                    : "Add a note..."
                }
                minHeight={
                  messageType === "email" ? "min-h-[80px]" : "min-h-[60px]"
                }
                className="resize-none pr-12"
              />

              <div className="absolute bottom-2 right-2 flex items-center">
                {message.length > 0 && (
                  <span className="text-xs text-muted-foreground mr-2">
                    {message.length > 1000 ? `${message.length}/2000` : ""}
                  </span>
                )}
                <Button
                  type="submit"
                  size="icon"
                  disabled={
                    isLoading ||
                    !message.trim() ||
                    (messageType === "email" && !emailSubject.trim())
                  }
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {messageType === "email" && (
            <p>
              Emails are sent with your company email as the sender address.
            </p>
          )}
          {messageType === "sms" && (
            <p>SMS messages will be sent from your company phone number.</p>
          )}
          {messageType === "note" && (
            <p>Notes are only visible internally and not sent to the lead.</p>
          )}
        </div>
      </form>
    </div>
  );
}
