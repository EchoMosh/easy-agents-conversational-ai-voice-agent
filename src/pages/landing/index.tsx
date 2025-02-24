
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronRight, Bot, Zap, Building2, Globe2, MessageSquare, LineChart, Shield } from 'lucide-react';

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Particle effect */}
      <div className="fixed inset-0 z-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            animate={{
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth,
              ],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
              ],
            }}
            transition={{
              duration: Math.random() * 10 + 5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <motion.div 
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div 
          className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 blur-3xl"
          style={{
            transform: `translate(${(mousePosition.x - window.innerWidth / 2) * 0.02}px, ${(mousePosition.y - window.innerHeight / 2) * 0.02}px)`,
          }}
        />
        
        <motion.h1 
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2 }}
        >
          The Future of AI Interactions
        </motion.h1>
        
        <motion.p 
          className="text-lg md:text-xl text-white/80 max-w-2xl mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Transform your business with AI agents that understand, engage, and deliver results. Welcome to the next evolution of customer interaction.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Link to="/auth">
            <Button size="lg" className="bg-white text-black hover:bg-white/90 text-lg px-8">
              Get Started <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Bento Grid Section */}
      <div className="relative z-10 px-4 py-20 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Revolutionizing Every Industry</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[
            {
              title: "Advanced AI Agents",
              description: "Powered by cutting-edge language models, our AI agents provide human-like interactions.",
              icon: <Bot className="h-6 w-6" />,
              gradient: "from-blue-500/20 to-purple-500/20"
            },
            {
              title: "Lightning Fast",
              description: "Real-time responses and seamless integration with your existing systems.",
              icon: <Zap className="h-6 w-6" />,
              gradient: "from-orange-500/20 to-red-500/20"
            },
            {
              title: "Enterprise Ready",
              description: "Scalable solutions designed for businesses of all sizes.",
              icon: <Building2 className="h-6 w-6" />,
              gradient: "from-green-500/20 to-emerald-500/20"
            },
            {
              title: "Global Reach",
              description: "Support customers 24/7 across multiple languages and time zones.",
              icon: <Globe2 className="h-6 w-6" />,
              gradient: "from-pink-500/20 to-rose-500/20"
            },
            {
              title: "Natural Conversations",
              description: "Engage in meaningful dialogues that feel genuinely human.",
              icon: <MessageSquare className="h-6 w-6" />,
              gradient: "from-violet-500/20 to-indigo-500/20"
            },
            {
              title: "Analytics & Insights",
              description: "Deep insights into customer interactions and agent performance.",
              icon: <LineChart className="h-6 w-6" />,
              gradient: "from-cyan-500/20 to-blue-500/20"
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="relative overflow-hidden backdrop-blur-xl bg-white/5 border-white/10 p-6 h-full hover:bg-white/10 transition-colors">
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-20`} />
                <div className="relative z-10">
                  <div className="mb-4 p-2 rounded-lg bg-white/10 w-fit">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-white/70">{item.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Security Badge */}
      <div className="relative z-10 py-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
          <Shield className="h-4 w-4 text-green-400" />
          <span className="text-sm text-white/70">Enterprise-grade security</span>
        </div>
      </div>
    </div>
  );
}
