
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { DragProvider } from '@/components/flow/drag-context';
import { Flow } from '@/components/flow/agent-flow/flow';
import { Header } from '@/components/flow/agent-flow/header';
import { useCallback, useState } from 'react';
import { Node, Edge } from '@xyflow/react';

// Sample initial data for development
const sampleAgent = {
  id: 'sample-id',
  name: 'Sample Agent',
  role: 'virtual_assistant' as const,
  is_active: true,
  created_at: new Date().toISOString(),
  user_id: 'sample-user-id',
  interaction_type: ['chat'],
  language: 'en',
  voice_id: null
};

const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'triggerNode',
    position: { x: 100, y: 100 },
    data: { platform: 'facebook', action: 'new_lead' }
  },
  {
    id: 'greeting-1',
    type: 'greetingNode',
    position: { x: 400, y: 100 },
    data: { greeting: 'Hello! How can I help you today?', outcomes: ['I need help', 'Just browsing'] }
  }
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: 'trigger-1',
    target: 'greeting-1',
    type: 'smoothstep'
  }
];

export default function AgentFlowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const handleNodesChange = useCallback((newNodes: Node[]) => {
    console.log('Nodes changed:', newNodes);
    setNodes(newNodes);
  }, []);

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    console.log('Edges changed:', newEdges);
    setEdges(newEdges);
  }, []);

  return (
    <DragProvider>
      <div className="fixed inset-0 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-slate-900 to-black">
        <div className="h-screen flex flex-col">
          <Header 
            agent={sampleAgent}
            onBack={() => navigate('/dashboard/agents')}
            onUpdateSettings={async () => {
              console.log('Settings update requested');
            }}
          />
          <div className="flex-1 relative">
            <ReactFlowProvider>
              <Flow
                initialNodes={nodes}
                initialEdges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
              />
            </ReactFlowProvider>
          </div>
        </div>
      </div>
    </DragProvider>
  );
}
