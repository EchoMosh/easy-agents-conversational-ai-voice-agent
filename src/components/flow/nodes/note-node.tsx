
import { StickyNote } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { NodeResizer } from '@xyflow/react';

type NoteNodeData = {
  note: string;
};

export function NoteNode({ data, selected }: { data: NoteNodeData; selected: boolean }) {
  const [note, setNote] = useState(data.note);

  return (
    <div className="group relative min-w-[150px] min-h-[100px]">
      {/* Enable resizing when node is selected */}
      <NodeResizer 
        minWidth={150}
        minHeight={100}
        isVisible={selected}
        lineClassName="border-yellow-500"
        handleClassName="h-4 w-4 border-2 border-yellow-500 bg-white dark:bg-yellow-900 hover:bg-yellow-50 dark:hover:bg-yellow-800 transition-colors"
        keepAspectRatio={false}
      />
      
      {/* Create stacked paper effect */}
      <div className="absolute inset-0 bg-yellow-100 dark:bg-yellow-800/40 rounded-sm rotate-[-1deg] translate-x-[3px] translate-y-[3px]" />
      <div className="absolute inset-0 bg-yellow-100 dark:bg-yellow-800/40 rounded-sm rotate-[1deg] translate-x-[-3px] translate-y-[2px]" />
      
      {/* Main note content */}
      <div className="relative bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-sm p-3 shadow-md border-b-4 border-r-4 border-yellow-200/50 dark:border-yellow-700/30">
        <div className="flex items-center gap-2 mb-2 opacity-50">
          <StickyNote className="h-3.5 w-3.5 text-yellow-700 dark:text-yellow-500" />
          <span className="text-xs font-medium text-yellow-800 dark:text-yellow-400">Note</span>
        </div>
        
        {/* Text area with paper-like styling */}
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add your note here..."
          className="nodrag w-full !min-h-[80px] bg-transparent border-none focus-visible:ring-0 resize-none text-sm leading-relaxed font-medium text-yellow-900/80 dark:text-yellow-100/80 placeholder:text-yellow-700/30 dark:placeholder:text-yellow-400/30"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(251, 191, 36, 0.1) 28px)',
            lineHeight: '28px',
            padding: '0',
          }}
        />
      </div>
      
      {/* Add a small shadow effect at the bottom */}
      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/5 to-transparent rounded-b-sm pointer-events-none" />

      {/* Show resize hint when selected */}
      {selected && (
        <div className="absolute bottom-0 right-0 p-1 text-[10px] font-medium text-yellow-600 dark:text-yellow-400 pointer-events-none">
          Drag corner to resize
        </div>
      )}
    </div>
  );
}
