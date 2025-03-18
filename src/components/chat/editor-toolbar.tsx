import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  ListOrdered,
  List,
  Smile,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Editor } from "@tiptap/react";

interface EditorToolbarProps {
  editor: Editor | null;
  className?: string;
  showSmileButton?: boolean;
  showAttachButton?: boolean;
  onSmileClick?: () => void;
  onAttachClick?: () => void;
}

export function EditorToolbar({
  editor,
  className,
  showSmileButton = true,
  showAttachButton = true,
  onSmileClick,
  onAttachClick,
}: EditorToolbarProps) {
  if (!editor) return null;

  const handleLinkClick = () => {
    // Get the current selected text
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", editor.isActive("bold") ? "bg-muted" : "")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", editor.isActive("italic") ? "bg-muted" : "")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8",
          editor.isActive("underline") ? "bg-muted" : ""
        )}
        onClick={() => editor.chain().focus().toggleMark("underline").run()}
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", editor.isActive("link") ? "bg-muted" : "")}
        onClick={handleLinkClick}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8",
          editor.isActive("bulletList") ? "bg-muted" : ""
        )}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8",
          editor.isActive("orderedList") ? "bg-muted" : ""
        )}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      {showSmileButton && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onSmileClick}
        >
          <Smile className="h-4 w-4" />
        </Button>
      )}

      {showAttachButton && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onAttachClick}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
