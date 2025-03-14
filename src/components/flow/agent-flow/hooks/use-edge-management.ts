
import { useCallback } from 'react';
import { Edge, Connection, addEdge, Node, EdgeMouseHandler } from '@xyflow/react';

export function useEdgeManagement() {
  const isValidConnection = useCallback((
    connection: Connection,
    nodes: Node[],
    edges: Edge[]
  ) => {
    const sourceNode = nodes.find(node => node.id === connection.source);
    const targetNode = nodes.find(node => node.id === connection.target);
    
    if (!sourceNode || !targetNode) {
      console.log('Connection invalid: Source or target node not found', { 
        source: connection.source, 
        target: connection.target 
      });
      return false;
    }

    if (connection.source === connection.target) {
      console.log('Connection invalid: Self-connection not allowed');
      return false;
    }

    const existingConnection = edges.find(edge => 
      edge.target === connection.target && 
      edge.source === connection.source
    );
    
    if (existingConnection) {
      console.log('Connection invalid: Duplicate connection');
      return false;
    }

    return true;
  }, []);

  const defaultEdgeOptions = {
    type: 'buttonEdge' as const,
    animated: true,
    style: {
      strokeWidth: 3,
      stroke: '#94a3b8',
    }
  };

  const onConnect = useCallback((
    params: Connection,
    edges: Edge[],
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
    onEdgesChange: (edges: Edge[]) => void,
    nodes: Node[]
  ) => {
    console.log('Connection attempt:', params);
    
    if (isValidConnection(params, nodes, edges)) {
      console.log('Connection valid, creating edge');
      
      const newEdges = addEdge(params, edges);
      console.log('New edges:', newEdges);
      setEdges(newEdges);
      onEdgesChange(newEdges);
    } else {
      console.log('Connection invalid');
    }
  }, [isValidConnection]);

  const onEdgeClick: EdgeMouseHandler = useCallback((event, edge) => {
    console.log('[Flow] Edge clicked:', edge);
  }, []);

  return {
    isValidConnection,
    defaultEdgeOptions,
    onConnect,
    onEdgeClick
  };
}
