
import { useState, useEffect } from 'react';
import { Zap, Construction, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { cn } from '@/lib/utils';

export default function AutomationsPage() {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; color: string; duration: number }>>([]);

  useEffect(() => {
    // Show content with a slight delay for a dramatic effect
    const timer = setTimeout(() => {
      setVisible(true);
    }, 300);

    // Generate random particles for the background
    const particlesArray = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // random x position (percentage)
      y: Math.random() * 100, // random y position (percentage)
      size: Math.random() * 8 + 3, // random size between 3 and 11px
      color: [
        'bg-blue-500', 'bg-purple-500', 'bg-indigo-400', 
        'bg-cyan-400', 'bg-violet-500', 'bg-fuchsia-400'
      ][Math.floor(Math.random() * 6)], // random color
      duration: (Math.random() * 15 + 10), // random duration between 10 and 25s
    }));
    setParticles(particlesArray);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container relative mx-auto px-6 py-12 overflow-hidden min-h-[80vh]">
      {/* Floating particles background */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={cn("absolute rounded-full opacity-30 z-0", particle.color)}
          style={{
            top: `${particle.y}%`,
            left: `${particle.x}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Moving gradient background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -inset-[100px] opacity-30 z-0">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, 50, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <AnimatePresence>
        {visible && (
          <motion.div 
            className="relative z-10 flex flex-col items-center justify-center text-center max-w-3xl mx-auto space-y-12"
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
              <motion.div 
                className="rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 w-32 h-32 flex items-center justify-center relative overflow-hidden"
                animate={{
                  boxShadow: [
                    '0 0 0 rgba(59, 130, 246, 0)', 
                    '0 0 30px rgba(59, 130, 246, 0.5)', 
                    '0 0 0 rgba(59, 130, 246, 0)'
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Zap className="h-16 w-16 text-blue-500 z-10" />
                
                {/* Pulsing effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 z-0"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                {/* Orbiting sparkle */}
                <motion.div 
                  className="absolute h-3 w-3 rounded-full bg-white z-20 shadow-lg shadow-blue-500/50"
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{ 
                    top: '10%',
                    left: '50%',
                    translateX: '-50%',
                    transformOrigin: 'center 600%', 
                  }}
                >
                  <Sparkles className="h-full w-full text-yellow-300" />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Coming soon text */}
            <div className="space-y-6">
              <motion.h1 
                className="text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                Automations Coming Soon
              </motion.h1>
              
              <motion.p 
                className="text-lg text-muted-foreground max-w-xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                We're working on powerful automation features to help you streamline your workflows and boost productivity.
                Stay tuned for updates!
              </motion.p>
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
                  icon: <Zap className="h-5 w-5 text-blue-500" />,
                  delay: 0
                },
                { 
                  title: "Smart Integrations", 
                  description: "Connect with your favorite tools and services for seamless operations.",
                  icon: <Sparkles className="h-5 w-5 text-purple-500" />,
                  delay: 0.2
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + feature.delay }}
                  className="relative h-full rounded-2xl p-0.5 group"
                >
                  <GlowingEffect
                    spread={30}
                    glow={false}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    variant="default"
                  />
                  
                  <Card className="h-full relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/10 dark:bg-slate-900/50 border-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 z-0" />
                    
                    <div className="relative z-10 p-6 flex items-start space-x-4">
                      <div className="p-2 rounded-full bg-blue-500/10 dark:bg-blue-500/20">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Get notified button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-8"
            >
              <Button 
                className="relative overflow-hidden group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-700/20 dark:shadow-blue-900/30 transition-all duration-300"
                size="lg"
              >
                <span className="relative z-10 flex items-center">
                  <Construction className="mr-2 h-4 w-4" />
                  Get Notified When It's Ready
                </span>
                <motion.span 
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-white/10 to-blue-500/0"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut"
                  }}
                />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
