import { useCallback, useRef, useState, useEffect, KeyboardEvent } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Node as FlowNode, // Rename to avoid conflict with DOM Node
  Edge,
  NodeTypes,
  useReactFlow,
  Panel,
  ViewportPortal,
  ConnectionMode,
  EdgeMouseHandler,
  getNodesBounds,
  applyNodeChanges, // Import applyNodeChanges
  applyEdgeChanges, // Import applyEdgeChanges
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./flow-styles.css";

import { NodeData } from "@/types/agent";
import { GreetingNode } from "@/components/flow/nodes/greeting-node";
import { EndNode } from "@/components/flow/nodes/end-node";
import { TriggerNode } from "@/components/flow/nodes/trigger-node";
import { StartNode } from "@/components/flow/nodes/start-node";
import { toast } from "sonner";

import { NodeUpdateContext } from "./node-update-context";
import { ButtonEdge } from "./edges/button-edge";
import { WidgetPanel } from "./widgets/widget-panel";
import {
  widgets as stableWidgets,
  WidgetDefinition as StableWidgetDefinition,
} from "./widgets/widget-definitions";
import { ShortcutsBar } from "./shortcuts-bar";
import { FlowContextMenu } from "./context-menu/flow-context-menu";
import { CustomContextMenu } from "./custom-context-menu";
import { useNodeManagement } from "./hooks/use-node-management";
import { useKeyboardShortcuts } from "./hooks/use-keyboard-shortcuts";
import { useEdgeManagement } from "./hooks/use-edge-management";
import { useDragAndDrop } from "./hooks/use-drag-and-drop";
import { AlertCircle, X as CloseIcon } from "lucide-react";

const nodeTypes: NodeTypes = {
  greetingNode: GreetingNode,
  endNode: EndNode,
  triggerNode: TriggerNode,
  startNode: StartNode,
};

const edgeTypes = {
  buttonEdge: ButtonEdge,
  default: ButtonEdge,
};

interface FlowProps {
  nodes: FlowNode[];
  edges: Edge[];
  onNodesChange: (nodes: FlowNode[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onNodeDeletion?: (
    deletedNodes: FlowNode[],
    remainingNodes: FlowNode[],
    remainingEdges: Edge[],
  ) => void;
  focusNodeId?: string | null;
  showDemoCursor?: boolean; // optional fake cursor overlay for demo
}

export function Flow({
  nodes: propsNodes,
  edges: propsEdges,
  onNodesChange,
  onEdgesChange,
  onNodeDeletion,
  focusNodeId,
  showDemoCursor,
}: FlowProps) {
  const [nodes, setNodes, onNodesChangeInternalOriginal] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeInternalOriginal] = useEdgesState([]);
  const [currentWidgets, setCurrentWidgets] =
    useState<StableWidgetDefinition[]>(stableWidgets);
  const [showWidgets, setShowWidgets] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { getNodes } = useReactFlow(); // Keep this for direct access if needed
  const flowContainerRef = useRef<HTMLDivElement>(null);
  const [showVariableTip, setShowVariableTip] = useState(false);
  const [variableTipDismissed, setVariableTipDismissed] = useState(false);
  const reactFlowInstance = useReactFlow();

  // Fake cursor overlay state (demo-only)
  const [cursorPos, setCursorPos] = useState<{
    x: number;
    y: number;
    visible: boolean;
  }>({
    x: 0,
    y: 0,
    visible: false,
  });
  const prevNodeCountRef = useRef(0);

  useEffect(() => {
    console.log("[Flow] Loading stable widget definitions.");
    setCurrentWidgets(stableWidgets);
  }, []);

  // Import custom hooks
  const {
    processingDeletion,
    rightClickedNodeId,
    contextMenuPosition,
    createNodeFromType,
    handleContextMenuAddNode: handleContextMenuAddNodeBase,
    handleNodeContextMenu: handleNodeContextMenuBase,
    handlePaneContextMenu: handlePaneContextMenuBase,
    handleDeleteSelectedNode: handleDeleteSelectedNodeBase,
    setRightClickedNodeId,
  } = useNodeManagement();

  const { handleFlowKeyDown: handleFlowKeyDownBase } = useKeyboardShortcuts();

  const {
    isValidConnection,
    defaultEdgeOptions,
    onConnect: onConnectBase,
    onEdgeClick,
  } = useEdgeManagement();

  const { onDragOver, onDragStart, onDrop: onDropBase } = useDragAndDrop();

  // Hook implementations with dependencies
  const handleContextMenuAddNode = useCallback(
    (nodeType: string) => {
      setRightClickedNodeId(undefined);
      handleContextMenuAddNodeBase(
        nodeType,
        nodes,
        setNodes,
        onNodesChange, // This onNodesChange is the prop
        reactFlowWrapper,
      );
    },
    [
      handleContextMenuAddNodeBase,
      nodes,
      setNodes,
      onNodesChange,
      reactFlowWrapper,
    ],
  );

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: FlowNode) => {
      event.preventDefault();
      event.stopPropagation();
      console.log("[Flow] Node context menu triggered for node:", node.id);
      handleNodeContextMenuBase(event, node, reactFlowWrapper);
    },
    [handleNodeContextMenuBase, reactFlowWrapper],
  );

  const handlePaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      console.log("[Flow] Pane context menu handler called");
      handlePaneContextMenuBase(event, reactFlowWrapper);
    },
    [handlePaneContextMenuBase, reactFlowWrapper],
  );

  const handleDeleteSelectedNode = useCallback(() => {
    handleDeleteSelectedNodeBase(
      selectedNodeId || rightClickedNodeId,
      nodes,
      edges,
      setNodes,
      setEdges,
      onNodesChange, // Prop
      onEdgesChange, // Prop
      onNodeDeletion,
    );
  }, [
    handleDeleteSelectedNodeBase,
    selectedNodeId,
    rightClickedNodeId,
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onNodeDeletion,
  ]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      const isEditingText =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        !isEditingText &&
        !processingDeletion
      ) {
        console.log(
          "[Flow] Delete/Backspace key pressed, checking for selected nodes",
        );

        const selectedNodes = nodes.filter((node) => node.selected);
        const selectedEdges = edges.filter((edge) => edge.selected);

        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          event.preventDefault();

          const nodeIdsToDelete = new Set(selectedNodes.map((n) => n.id));

          const newEdges = edges.filter(
            (edge) =>
              !nodeIdsToDelete.has(edge.source) &&
              !nodeIdsToDelete.has(edge.target) &&
              !edge.selected,
          );

          const newNodes = nodes.filter(
            (node) => !nodeIdsToDelete.has(node.id),
          );

          setNodes(newNodes); // Update local state
          setEdges(newEdges); // Update local state

          // Propagate changes immediately
          onNodesChange(newNodes);
          onEdgesChange(newEdges);

          if (onNodeDeletion && selectedNodes.length > 0) {
            onNodeDeletion(selectedNodes, newNodes, newEdges);
          }
        }
      }
    },
    [
      nodes,
      edges,
      setNodes,
      setEdges,
      onNodesChange,
      onEdgesChange,
      onNodeDeletion,
      processingDeletion,
    ],
  );

  const handleFlowKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const createNodeInCenter = (
        nodeType: string,
        position: { x: number; y: number },
      ) => {
        if (reactFlowWrapper.current) {
          const { screenToFlowPosition } = useReactFlow();
          const flowPosition = screenToFlowPosition(position);
          return createNodeFromType(
            nodeType,
            flowPosition,
            nodes,
            setNodes,
            onNodesChange, // Prop
          );
        }
      };

      handleFlowKeyDownBase(
        event,
        createNodeInCenter,
        reactFlowWrapper,
        handleKeyDown,
      );
    },
    [
      handleFlowKeyDownBase,
      createNodeFromType,
      handleKeyDown,
      nodes,
      setNodes,
      onNodesChange,
      reactFlowWrapper,
    ],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      onConnectBase(params, edges, setEdges, onEdgesChange, nodes); // Prop
    },
    [onConnectBase, edges, setEdges, onEdgesChange, nodes],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      const createNodeAtPosition = (
        nodeType: string,
        position: { x: number; y: number },
      ) => {
        createNodeFromType(nodeType, position, nodes, setNodes, onNodesChange); // Prop
      };

      onDropBase(event, reactFlowWrapper, createNodeAtPosition);
    },
    [
      onDropBase,
      reactFlowWrapper,
      createNodeFromType,
      nodes,
      setNodes,
      onNodesChange,
    ],
  );

  const normalizeNodes = useCallback((inputNodes: FlowNode[]) => {
    return inputNodes.map((node) => ({
      ...node,
      draggable: node.draggable !== false,
      type: node.type || "default",
      data: node.data || {},
    }));
  }, []);

  const updateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      console.log(
        `[Flow] updateNodeData called for node ${nodeId} with data:`,
        newData,
      );
      let updatedNodesArray: FlowNode[] = [];
      setNodes((nds) => {
        updatedNodesArray = nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...newData } }; // Ensure existing data is preserved
          }
          return node;
        });
        return updatedNodesArray;
      });
      // Propagate change immediately
      if (updatedNodesArray.length > 0) {
        console.log(
          `[Flow] Notifying parent component about node ${nodeId} update`,
        );
        onNodesChange(updatedNodesArray);
      }
    },
    [setNodes, onNodesChange], // Removed nodes from dependency array as setNodes provides current nodes
  );

  // Wrapper for onNodesChangeInternal to propagate to parent
  const onNodesChangeInternal = useCallback(
    (changes: any) => {
      setNodes((nds) => {
        const newNodes = applyNodeChanges(changes, nds);
        onNodesChange(newNodes);
        return newNodes;
      });
    },
    [setNodes, onNodesChange],
  );

  // Wrapper for onEdgesChangeInternal to propagate to parent
  const onEdgesChangeInternal = useCallback(
    (changes: any) => {
      setEdges((eds) => {
        const newEdges = applyEdgeChanges(changes, eds);
        onEdgesChange(newEdges);
        return newEdges;
      });
    },
    [setEdges, onEdgesChange],
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId],
  );

  // Only sync from props on initial load -- not on every prop change,
  // because our own drag callbacks propagate changes to parent which
  // flow back as props, causing a stale-position "bounce back" effect.
  // Normalize edges: ensure all edges use "buttonEdge" type (the only registered type)
  const normalizeEdges = useCallback((edges: Edge[]) => {
    return edges.map((edge) => ({
      ...edge,
      type: "buttonEdge",
      sourceHandle: edge.sourceHandle || "default",
      animated: edge.animated ?? true,
      style: edge.style || { strokeWidth: 3, stroke: "#94a3b8" },
    }));
  }, []);

  const initialSyncDone = useRef(false);
  useEffect(() => {
    if (!initialSyncDone.current && propsNodes && propsNodes.length > 0) {
      const normalizedNodes = normalizeNodes(
        Array.isArray(propsNodes) ? propsNodes : [],
      );
      setNodes(normalizedNodes);
      setEdges(normalizeEdges(Array.isArray(propsEdges) ? propsEdges : []));
      initialSyncDone.current = true;
    }
  }, [
    propsNodes,
    propsEdges,
    setNodes,
    setEdges,
    normalizeNodes,
    normalizeEdges,
  ]);

  // Re-sync if the number of nodes changes (e.g. node added/deleted externally)
  const prevNodeCount = useRef(0);
  useEffect(() => {
    const count = Array.isArray(propsNodes) ? propsNodes.length : 0;
    if (initialSyncDone.current && count !== prevNodeCount.current) {
      const normalizedNodes = normalizeNodes(
        Array.isArray(propsNodes) ? propsNodes : [],
      );
      setNodes(normalizedNodes);
      setEdges(normalizeEdges(Array.isArray(propsEdges) ? propsEdges : []));
      prevNodeCount.current = count;
    }
  }, [
    propsNodes,
    propsEdges,
    setNodes,
    setEdges,
    normalizeNodes,
    normalizeEdges,
  ]);

  // Effect to focus on a specific node when focusNodeId changes
  useEffect(() => {
    if (focusNodeId && reactFlowInstance) {
      console.log(`[Flow] Focusing on node: ${focusNodeId}`);

      const nodeToFocus = nodes.find((node) => node.id === focusNodeId);

      if (nodeToFocus) {
        reactFlowInstance.setCenter(
          nodeToFocus.position.x,
          nodeToFocus.position.y,
          { duration: 800, zoom: 0.8 },
        );
      }
    }
  }, [focusNodeId, nodes, reactFlowInstance]);

  // Focus the flow container on mount
  useEffect(() => {
    if (flowContainerRef.current) {
      flowContainerRef.current.focus();
    }
  }, []);

  // Move demo cursor to newly added node centers
  useEffect(() => {
    if (!showDemoCursor || !reactFlowInstance) return;

    const count = nodes.length;
    if (count > prevNodeCountRef.current) {
      const latest = nodes[count - 1];
      if (latest) {
        const { x, y, zoom } = reactFlowInstance.getViewport();
        // Approximate node center with slight offset
        const screenX = latest.position.x * zoom + x + 60;
        const screenY = latest.position.y * zoom + y + 40;
        setCursorPos({ x: screenX, y: screenY, visible: true });
      }
      prevNodeCountRef.current = count;
    }
  }, [nodes, showDemoCursor, reactFlowInstance]);

  // Track selected node & check for variable usage
  useEffect(() => {
    const selectedNode = nodes.find((node) => node.selected);
    setSelectedNodeId(selectedNode ? selectedNode.id : null);

    if (!variableTipDismissed) {
      let hasVariables = false;
      let hasAnyContent = false;

      nodes.forEach((node) => {
        if (node.data) {
          const messageFields = ["firstMessage", "greeting", "message"];
          for (const field of messageFields) {
            const content = node.data[field];
            if (typeof content === "string") {
              if (content.replace(/<p><\/p>/g, "").trim() !== "") {
                hasAnyContent = true;
              }
              if (
                content.includes('data-type="variable-mention"') ||
                /\{\{.*?\}\}/.test(content)
              ) {
                hasVariables = true;
                break;
              }
            }
          }
        }
        if (hasVariables) return;
      });

      if (hasVariables) {
        setShowVariableTip(false);
      } else if (nodes.length > 0 && hasAnyContent) {
        const dismissed = localStorage.getItem(
          "variableTipDismissed_generic_flow",
        );
        if (!dismissed) {
          setShowVariableTip(true);
        } else {
          setShowVariableTip(false);
        }
      } else {
        setShowVariableTip(false);
      }
    } else {
      setShowVariableTip(false);
    }
  }, [nodes, variableTipDismissed]);

  return (
    <NodeUpdateContext.Provider value={{ updateNodeData }}>
      <div
        ref={reactFlowWrapper}
        className="w-full h-full relative flow-editor-container overflow-hidden"
      >
        <div
          ref={flowContainerRef}
          className="w-full h-full"
          tabIndex={0}
          onKeyDown={handleFlowKeyDown}
          style={{ outline: "none", position: "relative" }}
        >
          {rightClickedNodeId !== undefined ? (
            <CustomContextMenu
              rightClickedNodeId={rightClickedNodeId}
              position={contextMenuPosition}
              onAddNode={handleContextMenuAddNode}
              onDeleteNode={handleDeleteSelectedNode}
              onClose={() => setRightClickedNodeId(undefined)}
              nodes={nodes}
            />
          ) : null}

          <FlowContextMenu
            rightClickedNodeId={rightClickedNodeId}
            onAddNode={handleContextMenuAddNode}
            onDeleteNode={handleDeleteSelectedNode}
            nodes={nodes}
          >
            <ReactFlow
              nodes={nodes.filter((node) => node.type !== "triggerNode")}
              edges={edges}
              onNodesChange={onNodesChangeInternal} // Use wrapped internal handler
              onEdgesChange={onEdgesChangeInternal} // Use wrapped internal handler
              onConnect={onConnect}
              onEdgeClick={onEdgeClick}
              onDragOver={onDragOver}
              onDrop={onDrop}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.5, maxZoom: 0.8 }}
              defaultEdgeOptions={defaultEdgeOptions}
              connectionMode={ConnectionMode.Loose}
              className="bg-transparent overflow-hidden"
              panOnScroll={true}
              zoomOnScroll={true}
              preventScrolling={true}
              snapToGrid={true}
              snapGrid={[15, 15]}
              deleteKeyCode={["Delete", "Backspace"]}
              onNodeContextMenu={handleNodeContextMenu}
              onPaneContextMenu={handlePaneContextMenu}
              onNodeClick={handleNodeClick}
              onInit={(reactFlowInstance) => {
                console.log("[Flow] ReactFlow initialized");

                const viewport = reactFlowInstance.getViewport();
                console.log("[Flow] Initial viewport:", viewport);

                setTimeout(() => {
                  reactFlowInstance.fitView({
                    padding: 0.5,
                    maxZoom: 0.8,
                    duration: 800,
                  });

                  const afterFitViewport = reactFlowInstance.getViewport();
                  console.log(
                    "[Flow] Viewport after fitView:",
                    afterFitViewport,
                  );
                }, 100);

                const currentNodes = reactFlowInstance.getNodes();
                console.log("[Flow] Current nodes after init:", currentNodes);
              }}
            >
              <Background className="opacity-40" />
              <MiniMap
                className="!bg-white/60 dark:!bg-gray-900/60 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden"
                nodeColor={(node) => {
                  switch (node.type) {
                    case "greetingNode":
                      return "#60a5fa";
                    case "triggerNode":
                      return "#fbbf24";
                    case "endNode":
                      return "#f87171";
                    case "startNode":
                      return "#a78bfa";
                    default:
                      return "#60a5fa";
                  }
                }}
                maskColor="rgba(0, 0, 0, 0.05)"
              />

              <ShortcutsBar />

              <WidgetPanel
                showWidgets={showWidgets}
                setShowWidgets={setShowWidgets}
                onDragStart={onDragStart}
                availableWidgets={currentWidgets}
              />

              {showVariableTip && (
                <Panel position="top-center">
                  <div className="mt-2 flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg shadow-md text-xs text-blue-700 dark:text-blue-300 animate-fade-in">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Tip: Personalize messages with variables! Type{" "}
                      <strong>@</strong> for lead or <strong>#</strong> for
                      agent variables.
                    </span>
                    <button
                      onClick={() => {
                        setShowVariableTip(false);
                        setVariableTipDismissed(true);
                        localStorage.setItem(
                          "variableTipDismissed_generic_flow",
                          "true",
                        );
                      }}
                      className="ml-2 p-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
                      aria-label="Dismiss tip"
                    >
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Panel>
              )}
            </ReactFlow>

            {showDemoCursor && cursorPos.visible && (
              <div
                className="pointer-events-none absolute z-[1000] transition-all duration-700 ease-out"
                style={{
                  left: cursorPos.x,
                  top: cursorPos.y,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="w-5 h-5 rounded-full bg-white border border-neutral-400 shadow-[0_2px_8px_rgba(0,0,0,0.25)]" />
              </div>
            )}
          </FlowContextMenu>
        </div>
      </div>
    </NodeUpdateContext.Provider>
  );
}
