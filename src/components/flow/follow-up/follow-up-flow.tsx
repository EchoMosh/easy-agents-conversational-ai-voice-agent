
import React, { useCallback } from 'react';
import { 
  ReactFlow, 
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  Panel,
  Node,
  Edge,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { EmailNode } from './nodes/email-node';
import { DelayNode } from './nodes/delay-node';
import { SmsNode } from './nodes/sms-node';
import { TriggerNode } from './nodes/trigger-node';

// Custom node types
const nodeTypes = {
  emailNode: EmailNode,
  delayNode: DelayNode,
  smsNode: SmsNode,
  triggerNode: TriggerNode,
};

// Initial nodes when no data exists
const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'triggerNode',
    position: { x: 250, y: 50 },
    data: { 
      label: 'Appointment Booked',
      outcomes: ['Appointment Booked']
    },
  },
];

const initialEdges: Edge[] = [];

interface FollowUpFlowProps {
  agentId: string;
  conversationOutcomes?: string[];
}

export function FollowUpFlow({ agentId, conversationOutcomes = [] }: FollowUpFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(
      { 
        ...params, 
        type: 'smoothstep',
        animated: true 
      }, 
      eds
    )),
    [setEdges]
  );

  const onAddNode = useCallback((nodeType: string) => {
    const newNode: Node = {
      id: `${nodeType}-${nodes.length + 1}`,
      type: `${nodeType}Node`,
      position: { 
        x: 250, 
        y: Math.max(...nodes.map(node => node.position.y)) + 150 
      },
      data: { 
        label: nodeType === 'delay' 
          ? 'Wait 24 hours' 
          : nodeType === 'email' 
            ? 'Send Email' 
            : 'Send SMS' 
      },
    };
    
    setNodes(nds => [...nds, newNode]);
  }, [nodes, setNodes]);

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-700">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#6366F1', strokeWidth: 2 },
          animated: true,
        }}
      >
        <Background color="#ccc" gap={16} />
        <Controls />
        <MiniMap />
        
        <Panel position="top-left" className="bg-white dark:bg-gray-800 p-2 rounded-md shadow-md">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium mb-2">Add Follow-up Actions</h3>
            <div className="flex gap-2">
              <button
                onClick={() => onAddNode('delay')}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100 rounded text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                + Delay
              </button>
              <button
                onClick={() => onAddNode('email')}
                className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-100 rounded text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-800"
              >
                + Email
              </button>
              <button
                onClick={() => onAddNode('sms')}
                className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 rounded text-xs font-medium hover:bg-green-200 dark:hover:bg-green-800"
              >
                + SMS
              </button>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
