import { Mail, MessageSquare, Phone, Send } from "lucide-react";
import { useState } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "./leads";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EmailTagInput } from "@/components/ui/email-tag-input";
import { Bold, Italic, List, ListOrdered, Quote, Undo, Redo } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { GreetingInput } from '@/components/flow/nodes/greeting/greeting-input';

export default function ChatsPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'chat' | 'email' | 'sms'>('chat');
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [cc, setCC] = useState<string[]>([]);
  const [bcc, setBCC] = useState<string[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setMessage(editor.getHTML());
    },
  });

  const { data: leads } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Lead[];
    }
  });

  const selectedLead = leads?.find(lead => lead.id === selectedLeadId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Sending ${messageType}:`, {
      message: messageType === 'email' ? message : editor?.getHTML() || message,
      subject,
      cc,
      bcc
    });
    setMessage("");
    editor?.commands.setContent('');
    if (messageType === 'email') {
      setSubject("");
      setCC([]);
      setBCC([]);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Leads sidebar */}
      <div className="w-80 border-r flex flex-col bg-muted/10">
        <div className="p-4 border-b bg-background">
          <Input placeholder="Search leads..." className="w-full" />
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {leads?.map((lead) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  selectedLeadId === lead.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "hover:bg-muted"
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  selectedLeadId === lead.id ? "bg-primary-foreground/20" : "bg-muted"
                }`}>
                  {lead.name[0].toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium leading-none mb-1">{lead.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {lead.email || lead.phone || "No contact info"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {selectedLead ? (
          <>
            <div className="border-b p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-lg">
                  {selectedLead.name[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedLead.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedLead.email || selectedLead.phone || "No contact info"}
                  </p>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4 max-w-3xl mx-auto">
                <div className="flex gap-3 items-start">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    Y
                  </span>
                  <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-2 text-sm">
                    This is a sample message in the unified chat stream.
                    All messages (chat, email, SMS) will appear here.
                  </div>
                </div>
                
                <div className="flex gap-3 items-start justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-4 py-2 text-sm">
                    This is a sample response
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    {selectedLead.name[0]}
                  </span>
                </div>
              </div>
            </ScrollArea>

            <div className="border-t p-6">
              <div className="max-w-3xl mx-auto space-y-4">
                <ToggleGroup type="single" value={messageType} onValueChange={(v) => setMessageType(v as typeof messageType)} className="justify-start">
                  <ToggleGroupItem value="chat" aria-label="Chat message">
                    <MessageSquare className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="email" aria-label="Email">
                    <Mail className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="sms" aria-label="SMS">
                    <Phone className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>

                <form onSubmit={handleSend} className="space-y-2">
                  {messageType === 'email' && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <div className="relative">
                            <Input
                              placeholder="Subject"
                              value={subject}
                              onChange={(e) => setSubject(e.target.value)}
                              className="w-full"
                            />
                            <span className="absolute left-2 -top-2.5 px-1 bg-background text-xs text-muted-foreground">
                              Subject
                            </span>
                          </div>
                        </div>
                        <EmailTagInput
                          label="CC"
                          value={cc}
                          onChange={setCC}
                          placeholder="Add CC emails..."
                        />
                        <EmailTagInput
                          label="BCC"
                          value={bcc}
                          onChange={setBCC}
                          placeholder="Add BCC emails..."
                        />
                      </div>
                      <div className="border rounded-md overflow-hidden">
                        <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => editor?.chain().focus().toggleBold().run()}
                            data-active={editor?.isActive('bold')}
                          >
                            <Bold className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => editor?.chain().focus().toggleItalic().run()}
                            data-active={editor?.isActive('italic')}
                          >
                            <Italic className="h-4 w-4" />
                          </Button>
                          <Separator orientation="vertical" className="mx-1 h-6" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => editor?.chain().focus().toggleBulletList().run()}
                            data-active={editor?.isActive('bulletList')}
                          >
                            <List className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                            data-active={editor?.isActive('orderedList')}
                          >
                            <ListOrdered className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                            data-active={editor?.isActive('blockquote')}
                          >
                            <Quote className="h-4 w-4" />
                          </Button>
                          <Separator orientation="vertical" className="mx-1 h-6" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => editor?.chain().focus().undo().run()}
                          >
                            <Undo className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => editor?.chain().focus().redo().run()}
                          >
                            <Redo className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="p-2 min-h-[150px]">
                          <EditorContent editor={editor} className="prose prose-sm max-w-none min-h-[150px]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    {messageType !== 'email' && (
                      <GreetingInput
                        value={message}
                        onChange={setMessage}
                      />
                    )}
                    {messageType === 'email' && (
                      <div className="flex justify-end">
                        <Button type="submit">
                          Send Email
                        </Button>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground">Select a lead to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Activity/History sidebar */}
      {selectedLead && (
        <div className="w-80 border-l p-6 bg-muted/10">
          <h3 className="font-semibold mb-4 text-lg">Activity History</h3>
          <div className="space-y-4">
            <div className="relative pl-4 border-l-2 border-muted-foreground/20">
              <time className="text-xs text-muted-foreground block mb-1">Today at 2:30 PM</time>
              <p className="text-sm">Email sent: Follow-up meeting</p>
            </div>
            <div className="relative pl-4 border-l-2 border-muted-foreground/20">
              <time className="text-xs text-muted-foreground block mb-1">Today at 1:15 PM</time>
              <p className="text-sm">Status changed to Qualified</p>
            </div>
            <div className="relative pl-4 border-l-2 border-muted-foreground/20">
              <time className="text-xs text-muted-foreground block mb-1">Yesterday at 4:45 PM</time>
              <p className="text-sm">Added to Pipeline: Sales 2024</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
