
import { useState, useCallback } from 'react';
import { Zap, Plus, ArrowRight, ArrowLeft, Power } from 'lucide-react';
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
  
  const handleRunNow = (automationId: string, automationName: string) => {
    toast({
      title: "Automation Triggered",
      description: `"${automationName}" has been triggered manually`,
    });
  };
  
  // Progress bar component
  const ProgressBar = () => (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
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
        <Button 
          onClick={startNewAutomation} 
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-700/20 dark:shadow-blue-900/30 transition-all duration-300"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Automation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {automations.length > 0 ? (
          automations.map((automation) => (
            <motion.div
              key={automation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ 
                scale: 1.03,
                transition: { duration: 0.2 }
              }}
            >
              <Card 
                className={`h-full backdrop-blur-sm overflow-hidden ${
                  automation.status === 'active' 
                    ? 'border-blue-400/50 dark:border-blue-500/40 shadow-xl shadow-blue-500/10 dark:shadow-blue-900/20' 
                    : 'border-gray-200/50 dark:border-gray-700/40 shadow-md'
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                  <div className="z-10">
                    <CardTitle className="text-xl">{automation.name}</CardTitle>
                    <CardDescription>{automation.type}</CardDescription>
                  </div>
                  
                  {/* Background glow effect */}
                  {automation.status === 'active' && (
                    <motion.div 
                      className="absolute inset-0 z-0"
                      initial={{ opacity: 0.05 }}
                      animate={{
                        opacity: [0.05, 0.15, 0.05],
                        background: [
                          'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0) 70%)',
                          'radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.5) 0%, rgba(124, 58, 237, 0) 70%)',
                          'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0) 70%)'
                        ]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  
                  <div className="z-10 flex items-center">
                    <motion.div
                      className={`p-1.5 rounded-full ${
                        automation.status === 'active' 
                          ? 'bg-blue-500/10 dark:bg-blue-500/20' 
                          : 'bg-gray-200 dark:bg-gray-800'
                      }`}
                      animate={automation.status === 'active' ? {
                        boxShadow: [
                          '0 0 0 rgba(59, 130, 246, 0)',
                          '0 0 15px rgba(59, 130, 246, 0.5)',
                          '0 0 0 rgba(59, 130, 246, 0)'
                        ],
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Zap 
                        className={`h-5 w-5 ${
                          automation.status === 'active' 
                            ? 'text-blue-500 drop-shadow-md' 
                            : 'text-gray-400'
                        }`}
                      />
                    </motion.div>
                    <div className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      automation.status === 'active' 
                        ? 'bg-blue-100/80 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'bg-gray-100/80 text-gray-800 dark:bg-gray-800/80 dark:text-gray-300'
                    }`}>
                      {automation.status}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-4">
                    Last run: {automation.lastRun}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-blue-200 dark:border-blue-900/30 transition-all hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400"
                    >
                      Edit
                    </Button>
                    {automation.status === 'inactive' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRunNow(automation.id, automation.name)}
                        className="border-blue-200 dark:border-blue-900/30 transition-all hover:text-blue-500 hover:border-blue-500 dark:hover:border-blue-700 dark:hover:text-blue-400"
                      >
                        <Power className="h-4 w-4 mr-1" />
                        Run now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <Card className="text-center py-12 col-span-full backdrop-blur-sm border-blue-200/20 dark:border-blue-900/20">
            <CardContent>
              <div className="space-y-4">
                <motion.div 
                  className="mx-auto bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full w-16 h-16 flex items-center justify-center"
                  animate={{
                    boxShadow: [
                      '0 0 0 rgba(59, 130, 246, 0)', 
                      '0 0 20px rgba(59, 130, 246, 0.5)', 
                      '0 0 0 rgba(59, 130, 246, 0)'
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Zap className="h-8 w-8 text-blue-500" />
                </motion.div>
                <h3 className="font-semibold text-lg">No automations yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Create your first automation to start automating your workflows.
                </p>
                <Button 
                  onClick={startNewAutomation} 
                  className="mt-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-700/20 dark:shadow-blue-900/30 transition-all duration-300"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Automation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showCreationDialog} onOpenChange={setShowCreationDialog}>
        <DialogContent className="sm:max-w-[500px] backdrop-blur-sm bg-background/95 border-blue-200/20 dark:border-blue-900/20">
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
                    className="focus-visible:ring-blue-500"
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
                    className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-accent transition-all"
                    whileHover={{ scale: 1.02, borderColor: 'rgba(59, 130, 246, 0.5)' }}
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
                    className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-accent transition-all"
                    whileHover={{ scale: 1.02, borderColor: 'rgba(245, 158, 11, 0.5)' }}
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
                    className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-accent transition-all"
                    whileHover={{ scale: 1.02, borderColor: 'rgba(59, 130, 246, 0.5)' }}
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
              <Button 
                variant="outline" 
                onClick={prevStep}
                className="border-blue-200/50 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => setShowCreationDialog(false)}
                className="border-blue-200/50 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700"
              >
                Cancel
              </Button>
            )}

            {currentStep < totalSteps ? (
              <Button 
                onClick={nextStep} 
                disabled={currentStep === 1 && !automationName}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md transition-all"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={completeSetup}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md transition-all"
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
