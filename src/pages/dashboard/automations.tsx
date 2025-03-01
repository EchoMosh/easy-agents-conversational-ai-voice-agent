
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
import { Zap, Plus, ArrowRight, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from "framer-motion";

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
  const [showCreationDialog, setShowCreationDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [automationName, setAutomationName] = useState('');
  const [templateType, setTemplateType] = useState('scratch');
  const totalSteps = 2; // Reduced from 3 to 2 steps by removing trigger step

  // Handle connection between nodes
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const startNewAutomation = () => {
    setShowCreationDialog(true);
    setCurrentStep(1);
    setAutomationName('');
    setTemplateType('scratch');
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const completeSetup = () => {
    setShowCreationDialog(false);
    toast({
      title: "Automation Created",
      description: `"${automationName}" automation has been created`,
    });
  };
  
  // Progress bar component
  const ProgressBar = () => (
    <div className="w-full bg-muted rounded-full h-2 mb-6">
      <motion.div
        className="h-full bg-primary rounded-full"
        initial={{ width: "0%" }}
        animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automations</h1>
          <p className="text-muted-foreground">Create and manage your automated workflows</p>
        </div>
        <Button onClick={startNewAutomation}>
          <Plus className="mr-2 h-4 w-4" />
          New Automation
        </Button>
      </div>

      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle>Automation Flow</CardTitle>
          <CardDescription>
            Your automation flows will appear here. Click "New Automation" to create one.
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
          </ReactFlow>
        </CardContent>
      </Card>

      <Dialog open={showCreationDialog} onOpenChange={setShowCreationDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentStep === 1 ? "Name Your Automation" : "Choose a Template"}
            </DialogTitle>
            <DialogDescription>
              {currentStep === 1 ? "Give your automation a descriptive name" : 
               "Select a template or start from scratch"}
            </DialogDescription>
          </DialogHeader>
          
          <ProgressBar />

          <div className="py-4">
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="automation-name">Automation Name</Label>
                  <Input 
                    id="automation-name" 
                    placeholder="Enter a name for your automation"
                    value={automationName}
                    onChange={(e) => setAutomationName(e.target.value)}
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <RadioGroup value={templateType} onValueChange={setTemplateType}>
                  <motion.div 
                    className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RadioGroupItem value="scratch" id="scratch" />
                    <Label htmlFor="scratch" className="flex-1 cursor-pointer">
                      <div className="font-medium">Start from scratch</div>
                      <div className="text-sm text-muted-foreground">Build your automation from the ground up</div>
                    </Label>
                    <Zap className="h-5 w-5 text-muted-foreground" />
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RadioGroupItem value="lead-notify" id="lead-notify" />
                    <Label htmlFor="lead-notify" className="flex-1 cursor-pointer">
                      <div className="font-medium">Lead Notification</div>
                      <div className="text-sm text-muted-foreground">Get notified when new leads come in</div>
                    </Label>
                    <Zap className="h-5 w-5 text-amber-500" />
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RadioGroupItem value="follow-up" id="follow-up" />
                    <Label htmlFor="follow-up" className="flex-1 cursor-pointer">
                      <div className="font-medium">Lead Follow-up</div>
                      <div className="text-sm text-muted-foreground">Automatically follow up with leads</div>
                    </Label>
                    <Zap className="h-5 w-5 text-blue-500" />
                  </motion.div>
                </RadioGroup>
              </motion.div>
            )}
          </div>

          <div className="flex justify-between mt-6">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setShowCreationDialog(false)}>
                Cancel
              </Button>
            )}

            {currentStep < totalSteps ? (
              <Button 
                onClick={nextStep} 
                disabled={currentStep === 1 && !automationName}
                className="transition-all"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={completeSetup}
                className="bg-primary hover:bg-primary/90 transition-all"
              >
                Create Automation
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
