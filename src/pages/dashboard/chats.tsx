import { Mail, Phone, Send, FileEdit, Save, X, Search, PlusCircle, History, StickyNote, Filter, User, FileText, Tag, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "./leads";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EmailTagInput } from "@/components/ui/email-tag-input";
import { Bold, Italic, List, ListOrdered, Quote, Undo, Redo } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { GreetingInput } from '@/components/flow/nodes/greeting/greeting-input';
import { VariableSelector } from '@/components/flow/nodes/variable-mention/variable-selector';
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Note {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

export default function ChatsPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'email' | 'sms'>('email');
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [cc, setCC] = useState<string[]>([]);
  const [bcc, setBCC] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState<"activity" | "notes" | "info" | "tasks" | "files">("activity");
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Follow up on proposal', completed: false, created_at: new Date().toISOString() },
    { id: '2', title: 'Send contract draft', completed: true, created_at: new Date().toISOString() }
  ]);
  const [newTask, setNewTask] = useState("");

  const queryClient = useQueryClient();

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setMessage(html);
      
      const formattedHtml = html.replace(
        /{{([^}]+)}}/g,
        '<span style="background-color: rgba(255, 255, 255, 0.4); color: rgb(37, 99, 235); padding: 2px 6px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); backdrop-filter: blur(4px); font-weight: 500;">{{$1}}</span>'
      );
      editor.commands.setContent(formattedHtml);
    },
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '@' && editor) {
        const { state } = editor;
        editor.chain().focus().insertContent('@').run();
      }
    };

    const element = document.querySelector('.ProseMirror');
    element?.addEventListener('keydown', handleKeyDown);

    return () => {
      element?.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor]);

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

  const { data: notes, isLoading: isLoadingNotes } = useQuery({
    queryKey: ['notes', selectedLeadId],
    queryFn: async () => {
      if (!selectedLeadId) return [];
      const { data, error } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', selectedLeadId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Note[];
    },
    enabled: !!selectedLeadId
  });

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedLeadId) throw new Error('Unauthorized');

      const { data, error } = await supabase
        .from('lead_notes')
        .insert([{
          lead_id: selectedLeadId,
          user_id: user.id,
          content
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', selectedLeadId] });
      setNewNote("");
      toast.success("Note added successfully");
    },
    onError: () => {
      toast.error("Failed to add note");
    }
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await supabase
        .from('lead_notes')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', selectedLeadId] });
      setEditingNoteId(null);
      setEditingNoteContent("");
      toast.success("Note updated successfully");
    },
    onError: () => {
      toast.error("Failed to update note");
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('lead_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', selectedLeadId] });
      toast.success("Note deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete note");
    }
  });

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addNoteMutation.mutate(newNote.trim());
  };

  const handleUpdateNote = (noteId: string) => {
    if (!editingNoteContent.trim()) return;
    updateNoteMutation.mutate({ id: noteId, content: editingNoteContent.trim() });
  };

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

  const filteredNotes = notes?.filter(note => 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activities = [
    {
      id: '1',
      type: 'email',
      content: 'Sent follow-up email about project timeline',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'sms',
      content: 'SMS reminder about meeting tomorrow',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  const filteredActivities = activities.filter(activity =>
    activity.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

            {/* Message composer */}
            <div className="border-t p-6">
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                  <ToggleGroup type="single" value={messageType} onValueChange={(v) => setMessageType(v as typeof messageType)} className="justify-start">
                    <ToggleGroupItem value="email" aria-label="Email">
                      <Mail className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="sms" aria-label="SMS">
                      <Phone className="h-4 w-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <Button type="submit" form="message-form">
                    <Send className="mr-2 h-4 w-4" />
                    Send {messageType === 'email' ? 'Email' : 'SMS'}
                  </Button>
                </div>

                <form id="message-form" onSubmit={handleSend} className="space-y-2">
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
                        <div className="p-2 min-h-[150px] [&_.ProseMirror_span]:bg-white/40 [&_.ProseMirror_span]:text-blue-600 [&_.ProseMirror_span]:dark:text-blue-300 [&_.ProseMirror_span]:px-1.5 [&_.ProseMirror_span]:py-0.5 [&_.ProseMirror_span]:rounded-md [&_.ProseMirror_span]:shadow-sm [&_.ProseMirror_span]:backdrop-blur-sm [&_.ProseMirror_span]:font-medium">
                          <EditorContent editor={editor} className="prose prose-sm max-w-none min-h-[150px]" />
                        </div>
                      </div>
                      <VariableSelector
                        text={message}
                        onTextChange={(newText) => {
                          if (editor) {
                            editor.commands.setContent(newText);
                          }
                        }}
                        textareaRef={null}
                      />
                    </div>
                  )}
                  {messageType === 'sms' && (
                    <div className="space-y-4">
                      <GreetingInput
                        value={message}
                        onChange={setMessage}
                      />
                    </div>
                  )}
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground">Select a lead to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Right sidebar with multiple tabs */}
      {selectedLead && (
        <div className="w-80 border-l flex flex-col bg-muted/10">
          <div className="p-4 border-b bg-background">
            <Command className="rounded-lg border shadow-md">
              <CommandInput
                placeholder="Search activities and notes..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
            </Command>
          </div>
          
          <Tabs value={currentTab} onValueChange={(value: "activity" | "notes" | "info" | "tasks" | "files") => setCurrentTab(value)} className="flex-1 flex flex-col">
            <div className="px-4 py-2 border-b bg-background">
              <TabsList className="w-full grid grid-cols-5">
                <TabsTrigger value="activity">
                  <History className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="notes">
                  <StickyNote className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="info">
                  <User className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="tasks">
                  <FileText className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="files">
                  <FileText className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <TabsContent value="activity" className="m-0 p-4">
                <div className="space-y-4">
                  {filteredActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg bg-background">
                      <div className={`rounded-full p-2 ${
                        activity.type === 'email' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {activity.type === 'email' ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{activity.content}</p>
                        <time className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </time>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="m-0 p-4 space-y-4">
                <form onSubmit={handleAddNote}>
                  <Textarea
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[100px] mb-2"
                  />
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={addNoteMutation.isPending}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </form>

                <div className="space-y-4">
                  {filteredNotes?.map((note) => (
                    <div key={note.id} className="relative p-3 border rounded-lg bg-background">
                      {editingNoteId === note.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingNoteContent}
                            onChange={(e) => setEditingNoteContent(e.target.value)}
                            className="min-h-[100px] mb-2"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleUpdateNote(note.id)}
                              disabled={updateNoteMutation.isPending}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setEditingNoteId(null);
                                setEditingNoteContent("");
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="pr-8">
                            <p className="whitespace-pre-wrap text-sm">{note.content}</p>
                            <time className="text-xs text-muted-foreground mt-2 block">
                              {new Date(note.created_at).toLocaleString()}
                            </time>
                          </div>
                          <div className="absolute top-3 right-3 flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingNoteId(note.id);
                                setEditingNoteContent(note.content);
                              }}
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteNoteMutation.mutate(note.id)}
                              disabled={deleteNoteMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="info" className="m-0 p-4">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
                    <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                      <p className="text-sm"><span className="font-medium">Name:</span> {selectedLead.name}</p>
                      <p className="text-sm"><span className="font-medium">Email:</span> {selectedLead.email || "Not provided"}</p>
                      <p className="text-sm"><span className="font-medium">Phone:</span> {selectedLead.phone || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        <Tag className="w-3 h-3 mr-1" />
                        New Lead
                      </Badge>
                      <Badge variant="secondary">
                        <Star className="w-3 h-3 mr-1" />
                        High Priority
                      </Badge>
                      <Button variant="outline" size="sm" className="h-6">
                        <PlusCircle className="w-3 h-3 mr-1" />
                        Add Tag
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Lead Score</h3>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">85/100</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">High Value</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="m-0 p-4">
                <div className="space-y-4">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newTask.trim()) return;
                    setTasks([
                      { id: crypto.randomUUID(), title: newTask, completed: false, created_at: new Date().toISOString() },
                      ...tasks
                    ]);
                    setNewTask("");
                  }}>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a task..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                      />
                      <Button type="submit">Add</Button>
                    </div>
                  </form>

                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2 p-3 border rounded-lg bg-background">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => {
                            setTasks(tasks.map(t =>
                              t.id === task.id ? { ...t, completed: !t.completed } : t
                            ));
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className={`text-sm flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setTasks(tasks.filter(t => t.id !== task.id))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="files" className="m-0 p-4">
                <div className="space-y-4">
                  <Button className="w-full">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>

                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg bg-background">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">proposal.pdf</p>
                          <p className="text-xs text-muted-foreground">Added 2 days ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      )}
    </div>
  );
}
