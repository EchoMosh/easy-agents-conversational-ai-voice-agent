
import { useCallback, useRef } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Node, Edge, NodeTypes, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NodeData } from '@/types/agent';
import { SpeakNode } from '@/components/flow/nodes/speak-node';
import { GreetingNode } from '@/components/flow/nodes/greeting-node';
import { EndNode } from '@/components/flow/nodes/end-node';
import { TriggerNode } from '@/components/flow/nodes/trigger-node';
import { TransferNode } from '@/components/flow/nodes/transfer-node';

const nodeTypes: NodeTypes = {
  speakNode: SpeakNode,
  greetingNode: GreetingNode,
  endNode: EndNode,
  triggerNode: TriggerNode,
  transferNode: TransferNode
};

interface FlowProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
}

export function Flow({ initialNodes, initialEdges, onNodesChange, onEdgesChange }: FlowProps) {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge(connection, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    if (reactFlowWrapper.current) {
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const type = event.dataTransfer.getData('application/reactflow') as NodeData['type'];
      if (!type) return;

      let nodeData: NodeData = {};
      
      switch (type) {
        case 'speakNode':
          nodeData = { message: 'Enter your message here' };
          break;
        case 'greetingNode':
          nodeData = { greeting: 'Enter your greeting here', outcomes: [] };
          break;
        case 'triggerNode':
          nodeData = { platform: undefined, action: undefined };
          break;
        case 'transferNode':
          nodeData = { message: 'Transfer to agent', outcomes: [] };
          break;
      }

      const newNode: Node<NodeData> = {
        id: `${type}-${Math.random()}`,
        type,
        position,
        data: nodeData
      };

      setNodes(nds => [...nds, newNode]);
    }
  }, [screenToFlowPosition, setNodes]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeInternal}
        onEdgesChange={onEdgesChangeInternal}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        }}
        className="bg-white dark:bg-gray-950"
      >
        <Background className="opacity-40" />
        <MiniMap
          className="!bg-white/60 dark:!bg-gray-900/60 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden"
          nodeColor={node => {
            switch (node.type) {
              case 'speakNode':
                return '#c084fc';
              case 'triggerNode':
                return '#fbbf24';
              case 'endNode':
                return '#f87171';
              case 'transferNode':
                return '#10b981';
              default:
                return '#60a5fa';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.05)"
        />
        <Controls />
      </ReactFlow>
    </div>
  );
}
