
import { useCallback, useContext } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';
import { NodeUpdateContext } from '../agent-flow/flow';
import { AgentSpeaksEditor } from './ai-agent-speaks/agent-speaks-editor';

export function AiAgentSpeaksNode({ id, data }: { id: string; data: any }) {
  const { updateNodeData } = useContext(NodeUpdateContext);

  const handleContentChange = useCallback((newContent: string) => {
    updateNodeData(id, {
      ...data,
      content: newContent
    });
  }, [id, data, updateNodeData]);

  return (
    <div className="group relative">
      {/* Glowing background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 shadow-[0_8px_16px_-6px_rgba(59,130,246,0.2)] dark:shadow-[0_8px_16px_-6px_rgba(59,130,246,0.3)] p-5 min-w-[300px] transition-all duration-500 hover:translate-y-[-2px] hover:shadow-[0_20px_40px_-12px_rgba(59,130,246,0.4)] dark:hover:shadow-[0_20px_40px_-12px_rgba(59,130,246,0.5)]">
        <div className="flex items-center gap-3 mb-3">
          <span className="relative flex h-8 w-8 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-lg bg-blue-400 opacity-20" />
            <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
              <MessageSquare className="h-4 w-4" />
            </span>
          </span>
          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">
            AI Agent Speaks
          </span>
        </div>
        
        <div className="mt-2">
          <AgentSpeaksEditor 
            content={data.content || ''} 
            onChange={handleContentChange}
          />
        </div>
      </div>

      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-2 !h-4 !bg-blue-400 rounded-sm border-none !left-[-8px] transition-all duration-300 hover:!bg-blue-500" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-2 !h-4 !bg-blue-400 rounded-sm border-none !right-[-8px] transition-all duration-300 hover:!bg-blue-500" 
      />
    </div>
  );
}
