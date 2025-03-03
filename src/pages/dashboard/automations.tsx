
import { useState, useEffect } from 'react';
import { Zap, MessageSquare, Clock, Workflow, MailCheck, FileText, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { Card } from '@/components/ui/card';

export default function AutomationsPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show content with a slight delay for a dramatic effect
    const timer = setTimeout(() => {
      setVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto px-6 py-12 min-h-[80vh]">
      {/* Main content */}
      <AnimatePresence>
        {visible && (
          <motion.div 
            className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto space-y-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* Animated icon */}
            <motion.div 
              className="relative"
              animate={{ y: [0, -10, 0] }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="rounded-full bg-slate-100 dark:bg-slate-800 w-24 h-24 flex items-center justify-center">
                <Zap className="h-12 w-12 text-slate-700 dark:text-slate-300" />
              </div>
            </motion.div>

            {/* Coming soon text */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Automations Coming Soon
              </h1>
              
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                We're working on powerful automation features to help you streamline your workflows and boost productivity.
                Stay tuned for updates!
              </p>
            </div>

            {/* Feature preview cards */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              {[
                { 
                  title: "Workflow Automation", 
                  description: "Create custom workflows that run automatically based on triggers and events.",
                  icon: <Workflow className="h-5 w-5 text-slate-700 dark:text-slate-300" />,
                  delay: 0
                },
                { 
                  title: "Smart Integrations", 
                  description: "Connect with your favorite tools and services for seamless operations.",
                  icon: <Zap className="h-5 w-5 text-slate-700 dark:text-slate-300" />,
                  delay: 0.2
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + feature.delay }}
                >
                  <Card className="h-full p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                        {feature.icon}
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">{feature.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">{feature.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Example use cases section */}
            <motion.div
              className="w-full mt-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
            >
              <h2 className="text-2xl font-semibold mb-6 text-slate-800 dark:text-slate-200">
                What You'll Be Able To Do
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: <MessageSquare className="h-10 w-10 text-slate-700 dark:text-slate-300" />,
                    title: "Automated Chat Responses",
                    description: "Send personalized follow-ups based on customer interactions without any manual work."
                  },
                  {
                    icon: <Clock className="h-10 w-10 text-slate-700 dark:text-slate-300" />,
                    title: "Schedule Tasks",
                    description: "Set up time-based triggers to execute actions at specific intervals or dates."
                  },
                  {
                    icon: <MailCheck className="h-10 w-10 text-slate-700 dark:text-slate-300" />,
                    title: "Email Campaigns",
                    description: "Create and automate email sequences that nurture leads through your pipeline."
                  }
                ].map((example, index) => (
                  <Card key={index} className="p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col items-center text-center">
                    <div className="mb-4">
                      {example.icon}
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">
                      {example.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {example.description}
                    </p>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Replace other software section */}
            <motion.div
              className="w-full mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9 }}
            >
              <Card className="p-8 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <h2 className="text-2xl font-semibold mb-6 text-slate-800 dark:text-slate-200 text-left">
                  Replace Your Stack of Tools
                </h2>
                
                <div className="space-y-6">
                  {[
                    {
                      title: "Email Marketing Platforms",
                      description: "No need for separate email marketing tools. Create, send, and track email campaigns directly.",
                      icon: <FileText className="h-5 w-5" />
                    },
                    {
                      title: "Task Management Systems",
                      description: "Automate your task creation and assignment without switching between different platforms.",
                      icon: <FileText className="h-5 w-5" />
                    },
                    {
                      title: "Customer Support Software",
                      description: "Handle support requests automatically with intelligent routing and response suggestions.",
                      icon: <FileText className="h-5 w-5" />
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-4 text-left">
                      <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-1">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-lg text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
