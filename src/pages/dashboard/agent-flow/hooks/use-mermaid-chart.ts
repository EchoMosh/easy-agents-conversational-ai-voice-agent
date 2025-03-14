
import { useState } from 'react';
import { FlowData, FlowNode, FlowEdge } from '@/types/agent-types';

function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  let content = html.replace(/<span class="editor-variable"[^>]*data-variable="([^"]+)"[^>]*>\{([^}]+)\}<\/span>/g, '{$2}');
  
  content = content.replace(/<\/?[^>]+(>|$)/g, '');
  
  return content;
}

function generateMermaidFromFlow(flowData: FlowData): string {
  if (!flowData || !flowData.nodes || !flowData.edges) {
    return 'graph TD\n  EmptyFlow[Empty Flow]';
  }

  if (Array.isArray(flowData.nodes) && flowData.nodes.length === 0) {
    return 'graph TD\n  EmptyFlow[Empty Flow]';
  }

  let mermaidString = 'graph TD\n';
  
  const nodeIdMap = new Map<string, string>();
  
  const nodeTypeCounter: Record<string, number> = {};
  
  flowData.nodes.forEach((node: FlowNode) => {
    let baseNodeType = node.type?.replace(/([A-Za-z]+).*/, '$1') || 'node';
    
    if (baseNodeType === 'greetingNode') {
      baseNodeType = 'speak';
    } else if (baseNodeType === 'speakNode') {
      baseNodeType = 'speak';
    } else if (baseNodeType === 'endNode') {
      baseNodeType = 'end';
    } else if (baseNodeType === 'triggerNode') {
      baseNodeType = 'trigger';
    } else if (baseNodeType === 'webhookNode') {
      baseNodeType = 'webhook';
    } else if (baseNodeType === 'transferNode') {
      baseNodeType = 'transfer';
    }
    
    if (!nodeTypeCounter[baseNodeType]) {
      nodeTypeCounter[baseNodeType] = 1;
    } else {
      nodeTypeCounter[baseNodeType]++;
    }
    
    const simpleId = `${baseNodeType}-${nodeTypeCounter[baseNodeType]}`;
    nodeIdMap.set(node.id, simpleId);
  });
  
  flowData.nodes.forEach((node: FlowNode) => {
    let nodeLabel = '';
    let outcomeLabels: string[] = [];
    
    if (node.data) {
      if (node.type === 'speakNode' && node.data.message) {
        nodeLabel = stripHtmlTags(String(node.data.message));
        if (node.data.outcomes && Array.isArray(node.data.outcomes)) {
          outcomeLabels = node.data.outcomes.map(outcome => stripHtmlTags(String(outcome)));
        }
      } else if (node.type === 'greetingNode' && node.data.greeting) {
        nodeLabel = stripHtmlTags(String(node.data.greeting));
        if (node.data.outcomes && Array.isArray(node.data.outcomes)) {
          outcomeLabels = node.data.outcomes.map(outcome => stripHtmlTags(String(outcome)));
        }
      } else if (node.type === 'endNode' && node.data.message) {
        nodeLabel = `End: ${stripHtmlTags(String(node.data.message))}`;
      } else if (node.type === 'endNode') {
        nodeLabel = 'End Call';
      } else if (node.type === 'triggerNode' && node.data.platform) {
        nodeLabel = String(node.data.platform);
      } else if (node.type === 'webhookNode') {
        nodeLabel = node.data.url ? `Webhook: ${node.data.url}` : 'Webhook';
      }
    }
    
    const cleanLabel = nodeLabel
      .replace(/\n/g, ' ')
      .replace(/"/g, '');
    
    const simpleId = nodeIdMap.get(node.id) || `unknown-${node.id}`;
    
    if (cleanLabel) {
      mermaidString += `  ${simpleId}["${cleanLabel}"]\n`;
    } else {
      mermaidString += `  ${simpleId}[]\n`;
    }
    
    if (outcomeLabels.length > 0) {
      mermaidString += `  %% Node ${simpleId} has outcomes: ${outcomeLabels.join(', ')}\n`;
    }
  });
  
  const validEdges = flowData.edges.filter((edge: FlowEdge) => 
    nodeIdMap.has(edge.source) && nodeIdMap.has(edge.target)
  );
  
  validEdges.forEach((edge: FlowEdge) => {
    const sourceId = nodeIdMap.get(edge.source) || edge.source;
    const targetId = nodeIdMap.get(edge.target) || edge.target;
    
    const sourceNode = flowData.nodes.find(node => node.id === edge.source);
    let edgeLabel = '';
    
    if (sourceNode && sourceNode.data && (sourceNode.type === 'speakNode' || sourceNode.type === 'greetingNode')) {
      const outcomes = sourceNode.data.outcomes && Array.isArray(sourceNode.data.outcomes) 
        ? sourceNode.data.outcomes 
        : [];
      
      if (edge.sourceHandle && edge.sourceHandle.startsWith('outcome-')) {
        const outcomeIndex = parseInt(edge.sourceHandle.replace('outcome-', ''), 10);
        if (!isNaN(outcomeIndex) && outcomeIndex < outcomes.length) {
          const outcomeText = stripHtmlTags(outcomes[outcomeIndex]).replace(/"/g, '');
          edgeLabel = `|"${outcomeText}"|`;
        }
      }
    }
    
    mermaidString += `  ${sourceId} --> ${edgeLabel} ${targetId}\n`;
  });
  
  return mermaidString;
}

function sanitizeMermaidChart(mermaidChart: string): string {
  return mermaidChart
    .replace(/classDef .+/g, '')
    .replace(/:::[a-zA-Z0-9_-]+/g, '');
}

export function useMermaidChart() {
  const [mermaidChart, setMermaidChart] = useState<string>('');

  const generateAndSetMermaidChart = (flowData: FlowData) => {
    let mermaidChartStr = generateMermaidFromFlow(flowData);
    mermaidChartStr = sanitizeMermaidChart(mermaidChartStr);
    setMermaidChart(mermaidChartStr);
    return mermaidChartStr;
  };

  return { 
    mermaidChart, 
    setMermaidChart,
    generateAndSetMermaidChart,
    generateMermaidFromFlow,
    sanitizeMermaidChart
  };
}
