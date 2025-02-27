
import React, { useCallback, useEffect, useRef } from 'react';
import { 
  ReactFlow, 
  Background, 
  useNodesState, 
  useEdgesState,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlowData } from '@/types/agent-types';

interface AgentFlowPreviewProps {
  flowData: FlowData | undefined | string;
  maxHeight?: number;
}

export function AgentFlowPreviewContent({ flowData, maxHeight = 120 }: AgentFlowPreviewProps) {
  // Parse flow data if it's a string
  const parsedFlow = typeof flowData === 'string' 
    ? JSON.parse(flowData) 
    : flowData || { nodes: [], edges: [] };
  
  const [nodes, setNodes] = useNodesState(parsedFlow.nodes || []);
  const [edges, setEdges] = useEdgesState(parsedFlow.edges || []);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Update nodes and edges when flowData changes
    if (flowData) {
      const flow = typeof flowData === 'string' 
        ? JSON.parse(flowData) 
        : flowData;
      
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
    }
  }, [flowData, setNodes, setEdges]);

  const getNodeColor = useCallback((type: string | undefined) => {
    switch (type) {
      case 'speakNode':
        return '#c084fc';
      case 'greetingNode':
        return '#60a5fa';
      case 'endNode':
        return '#f87171';
      case 'triggerNode':
        return '#fbbf24';
      case 'transferNode':
        return '#10b981';
      default:
        return '#94a3b8';
    }
  }, []);

  return (
    <div 
      ref={wrapperRef} 
      style={{ height: maxHeight, width: '100%' }}
      className="rounded-md overflow-hidden border border-muted bg-background/50"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnScroll={false}
        preventScrolling={false}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.2}
        maxZoom={0.8}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
      >
        <Background color="#eee" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

// Wrap component with ReactFlowProvider to use outside of a flow context
export function AgentFlowPreview(props: AgentFlowPreviewProps) {
  return (
    <ReactFlowProvider>
      <AgentFlowPreviewContent {...props} />
    </ReactFlowProvider>
  );
}
