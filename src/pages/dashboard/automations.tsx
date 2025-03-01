
import { useState, useCallback } from 'react';
import { Zap, Plus, ArrowRight, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from "framer-motion";

export default function AutomationsPage() {
  const { toast } = useToast();
  const [showCreationDialog, setShowCreationDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [automationName, setAutomationName] = useState('');
  const [templateType, setTemplateType] = useState('scratch');
  const totalSteps = 2;

  // Mock automation data - this would typically come from an API or state management
  const automations = [
    { id: '1', name: 'Lead Follow-up', status: 'active', lastRun: '2 hours ago', type: 'Email sequence' },
    { id: '2', name: 'Welcome Message', status: 'active', lastRun: '1 day ago', type: 'Chat response' },
    { id: '3', name: 'Appointment Reminder', status: 'inactive', lastRun: 'Never', type: 'SMS notification' },
  ];

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
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ 
            duration: 0.5, 
            ease: "easeInOut",
            type: "tween"
          }}
        />
      </div>
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

      <div className="grid gap-6">
        {automations.length > 0 ? (
          automations.map((automation) => (
            <Card key={automation.id} className="hover:bg-accent/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>{automation.name}</CardTitle>
                  <CardDescription>{automation.type}</CardDescription>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  automation.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {automation.status}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Last run: {automation.lastRun}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm">
                    <Zap className="h-4 w-4 mr-1" />
                    Run now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="space-y-4">
                <div className="mx-auto bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">No automations yet</h3>
                <p className="text-muted-foreground">
                  Create your first automation to start automating your workflows.
                </p>
                <Button onClick={startNewAutomation} className="mt-2">
                  <Plus className="mr-2 h-4 w-4" />
                  New Automation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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
