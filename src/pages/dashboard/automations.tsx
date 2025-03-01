
import { useState, useCallback } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  Panel, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Connection,
  Edge,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Zap, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Define initial nodes for the automation flow
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Trigger' },
    position: { x: 250, y: 25 },
    style: {
      background: 'rgba(251, 191, 36, 0.2)',
      border: '1px solid #fbbf24',
      borderRadius: '8px',
      padding: '10px',
      width: 150,
    },
  },
  {
    id: '2',
    data: { label: 'Process' },
    position: { x: 250, y: 125 },
    style: {
      background: 'rgba(96, 165, 250, 0.2)',
      border: '1px solid #60a5fa',
      borderRadius: '8px',
      padding: '10px',
      width: 150,
    },
  },
  {
    id: '3',
    type: 'output',
    data: { label: 'Action' },
    position: { x: 250, y: 225 },
    style: {
      background: 'rgba(16, 185, 129, 0.2)',
      border: '1px solid #10b981',
      borderRadius: '8px',
      padding: '10px',
      width: 150,
    },
  },
];

// Define initial edges connecting the nodes
const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true },
];

export default function AutomationsPage() {
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedAutomation, setSelectedAutomation] = useState<string | null>(null);

  // Handle connection between nodes
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Sample automation templates
  const automationTemplates = [
    { id: 'new-lead', name: 'New Lead Notification', description: 'Send notification when a new lead is created' },
    { id: 'follow-up', name: 'Lead Follow-up', description: 'Schedule follow-up email when lead is inactive' },
    { id: 'task-reminder', name: 'Task Reminder', description: 'Send reminder before task deadline' },
  ];

  const handleCreateAutomation = (templateId: string) => {
    setSelectedAutomation(templateId);
    toast({
      title: "Automation Template Selected",
      description: `You've selected the ${automationTemplates.find(t => t.id === templateId)?.name} template`,
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automations</h1>
          <p className="text-muted-foreground">Create and manage your automated workflows</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Automation
        </Button>
      </div>

      {!selectedAutomation ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {automationTemplates.map((template) => (
            <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-amber-500" />
                  {template.name}
                </CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleCreateAutomation(template.id)}
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="h-[600px]">
          <CardHeader>
            <CardTitle>
              {automationTemplates.find(t => t.id === selectedAutomation)?.name}
            </CardTitle>
            <CardDescription>
              Design your automation flow by connecting triggers, conditions, and actions
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[500px]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
              <Panel position="top-right">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedAutomation(null)}
                >
                  Back to Templates
                </Button>
              </Panel>
            </ReactFlow>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
