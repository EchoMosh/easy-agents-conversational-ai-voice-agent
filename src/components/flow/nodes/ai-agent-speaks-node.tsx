
import { useCallback, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Tv2 } from 'lucide-react';
import { NodeUpdateContext } from '../agent-flow/flow';
import { useContext } from 'react';
import { AgentSpeaksEditor } from './ai-agent-speaks/agent-speaks-editor';

export function AiAgentSpeaksNode({ id, data }: { id: string; data: any }) {
  const { updateNodeData } = useContext(NodeUpdateContext);
  const [isEditing, setIsEditing] = useState(false);

  const handleContentChange = useCallback((newContent: string) => {
    updateNodeData(id, {
      ...data,
      content: newContent
    });
  }, [id, data, updateNodeData]);

  return (
    <div className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 flex flex-col gap-2 min-w-[300px]">
      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
          <Tv2 className="h-4 w-4 text-blue-500 dark:text-blue-400" />
        </div>
        <span className="font-medium text-sm">AI Agent Speaks</span>
      </div>
      
      <div className="mt-2">
        <AgentSpeaksEditor 
          content={data.content || ''} 
          onChange={handleContentChange}
        />
      </div>

      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#64748b' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#64748b' }}
      />
    </div>
  );
}
