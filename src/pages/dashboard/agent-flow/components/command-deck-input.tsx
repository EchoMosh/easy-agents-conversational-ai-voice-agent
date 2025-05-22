import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Sparkles } from 'lucide-react';

interface CommandDeckInputProps {
  debug?: boolean;
}

export function CommandDeckInput({ debug = false }: CommandDeckInputProps) {
  useEffect(() => {
    console.log("🚀 CommandDeckInput useEffect MOUNTED");
  }, []);
  
  return (
    <div className="p-3 border-2 border-purple-300 dark:border-purple-800 bg-background/95 backdrop-blur-md flex items-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(124,58,237,0.1)] rounded-xl animate-fadeIn"> 
      <div className="flex items-center w-full gap-3">
        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
          <Sparkles className="h-4 w-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
        </div>
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Describe what you want to build or type a command..."
            className="w-full text-sm focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 border-purple-200 dark:border-purple-800"
          />
        </div>
      </div>
    </div>
  );
}
