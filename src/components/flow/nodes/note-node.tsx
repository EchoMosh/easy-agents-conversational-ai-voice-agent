
import { StickyNote } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

type NoteNodeData = {
  note: string;
};

export function NoteNode({ data }: { data: NoteNodeData }) {
  const [note, setNote] = useState(data.note);

  return (
    <div className="group relative min-w-[200px] max-w-[300px]">
      <div className="absolute inset-0 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg rotate-[-1deg] translate-x-[2px] translate-y-[2px]" />
      <div className="absolute inset-0 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg rotate-[1deg] translate-x-[-2px] translate-y-[-2px]" />
      <div className="relative bg-yellow-100 dark:bg-yellow-900/20 rounded-lg p-4 shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <StickyNote className="h-4 w-4 text-yellow-700 dark:text-yellow-500" />
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Note</span>
        </div>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add your note here..."
          className="nodrag min-h-[100px] bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-700/50 text-yellow-900 dark:text-yellow-100 placeholder:text-yellow-700/50 dark:placeholder:text-yellow-400/50 focus-visible:ring-yellow-500/50 resize-none"
        />
      </div>
    </div>
  );
}
