
import React, { useCallback, useEffect, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  useNodesState, 
  useEdgesState,
  ReactFlowProvider,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlowData } from '@/types/agent-types';

interface AgentFlowPreviewProps {
  flowData: FlowData | undefined | string;
  maxHeight?: number;
}

export function AgentFlowPreviewContent({ flowData, maxHeight = 120 }: AgentFlowPreviewProps) {
  const [parsedNodes, setParsedNodes] = useState<Node[]>([]);
  const [parsedEdges, setParsedEdges] = useState<Edge[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Process flow data when it changes
  useEffect(() => {
    if (!flowData) {
      setParsedNodes([]);
      setParsedEdges([]);
      return;
    }
    
    try {
      let processedFlow: any;
      
      // Parse string if needed
      if (typeof flowData === 'string') {
        processedFlow = JSON.parse(flowData);
      } else {
        processedFlow = flowData;
      }
      
      // Handle the case where the flow data might be nested in a 'flow' property
      if (processedFlow.flow && (processedFlow.flow.nodes || processedFlow.flow.edges)) {
        processedFlow = processedFlow.flow;
      }
      
      // Log what we're working with
      console.log('Processing flow data for preview:', processedFlow);
      
      // Set the nodes and edges
      const flowNodes = Array.isArray(processedFlow.nodes) ? processedFlow.nodes : [];
      const flowEdges = Array.isArray(processedFlow.edges) ? processedFlow.edges : [];
      
      // If there are no nodes or edges, render an empty state
      if (flowNodes.length === 0) {
        console.log('No nodes in flow data, rendering empty state');
        setParsedNodes([]);
        setParsedEdges([]);
        return;
      }
      
      // Apply styling to nodes for better preview
      const styledNodes = flowNodes.map((node: any) => ({
        ...node,
        // Apply visual styles for the preview
        style: {
          ...node.style,
          background: getNodeColor(node.type),
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '9px',
          padding: '4px',
          width: node.width || 100,
          height: node.height || 40,
        },
        // Simplify labels for the small preview
        data: {
          ...node.data,
          label: node.data?.label || node.type || 'node'
        },
        // Make sure handles are properly identified for the preview
        sourcePosition: node.sourcePosition || 'right',
        targetPosition: node.targetPosition || 'left',
      }));
      
      // Apply styling to edges for better visibility
      const styledEdges = flowEdges.filter((edge: any) => {
        // Only include edges that connect existing nodes
        return flowNodes.some(n => n.id === edge.source) && 
               flowNodes.some(n => n.id === edge.target);
      }).map((edge: any) => ({
        ...edge,
        style: {
          ...edge.style,
          stroke: '#94a3b8',
          strokeWidth: 2,
        },
        animated: true,
        type: 'default',
      }));
      
      setParsedNodes(styledNodes);
      setParsedEdges(styledEdges);
    } catch (error) {
      console.error('Error processing flow data for preview:', error);
      setParsedNodes([]);
      setParsedEdges([]);
    }
  }, [flowData]);

  // Update ReactFlow when our parsed data changes
  useEffect(() => {
    setNodes(parsedNodes);
    setEdges(parsedEdges);
  }, [parsedNodes, parsedEdges, setNodes, setEdges]);

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
      case 'webhookNode':
        return '#d946ef';
      default:
        return '#94a3b8';
    }
  }, []);

  return (
    <div 
      style={{ height: maxHeight, width: '100%' }}
      className="rounded-md overflow-hidden border border-muted bg-background/50"
    >
      {(parsedNodes.length === 0 && parsedEdges.length === 0) ? (
        <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
          No flow data available
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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
          defaultEdgeOptions={{
            animated: true,
            style: {
              stroke: '#94a3b8',
              strokeWidth: 2,
            },
          }}
          fitViewOptions={{ 
            padding: 0.2,
            includeHiddenNodes: true, 
          }}
        >
          <Background color="#eee" gap={12} size={1} />
        </ReactFlow>
      )}
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
