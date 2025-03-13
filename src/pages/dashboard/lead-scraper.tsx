
import { useState, useEffect } from 'react';
import { Scan, MessageSquare, ArrowRight, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeadScraperPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show content with a slight delay for a dramatic effect
    const timer = setTimeout(() => {
      setVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl min-h-[80vh]">
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
                <Scan className="h-12 w-12 text-slate-700 dark:text-slate-300" />
              </div>
            </motion.div>

            {/* Title */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Lead Scraper Coming Soon
              </h1>
              
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                Automatically discover and collect qualified leads from across the web, saving you hours of manual research.
              </p>
            </div>

            {/* Feature preview cards */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              {[
                { 
                  title: "Intelligent Discovery", 
                  description: "AI identifies high-quality leads by analyzing websites, social profiles, and business directories.",
                  icon: <Scan className="h-5 w-5 text-slate-700 dark:text-slate-300" />,
                  delay: 0
                },
                { 
                  title: "Automated Enrichment", 
                  description: "Enhance lead data with contact information, company details, and social profiles.",
                  icon: <Zap className="h-5 w-5 text-slate-700 dark:text-slate-300" />,
                  delay: 0.2
                },
                { 
                  title: "Seamless Integration", 
                  description: "Leads flow directly into your pipeline, ready for your AI agents to engage with personalized outreach.",
                  icon: <MessageSquare className="h-5 w-5 text-slate-700 dark:text-slate-300" />,
                  delay: 0.4
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

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="w-full mt-4"
            >
              <Card className="bg-muted/30 p-6 border border-slate-200 dark:border-slate-700">
                <CardContent className="flex flex-col items-center justify-center p-4">
                  <h3 className="text-xl font-medium mb-4">Join the waitlist to get early access</h3>
                  <Button className="gap-2 bg-primary hover:bg-primary/90">
                    Join the waitlist 
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
                <CardFooter className="flex justify-center pt-2 pb-0">
                  <p className="text-sm text-muted-foreground">
                    Have specific scraping needs? <a href="#" className="text-primary hover:underline">Let us know</a>
                  </p>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
