
import { Node as FlowNode, Edge } from '@xyflow/react';

export type FlowNode = FlowNode;
export type FlowEdge = Edge;

export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}
