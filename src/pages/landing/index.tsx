
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronRight, Bot, Zap, Building2, Globe2, MessageSquare, LineChart, Shield } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleAuth = (mode: 'login' | 'signup') => {
    navigate(`/auth?mode=${mode}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-slate-950 text-white overflow-hidden">
      {/* Hero Section */}
      <motion.div 
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl"
          style={{
            transform: `translate(${(mousePosition.x - window.innerWidth / 2) * 0.02}px, ${(mousePosition.y - window.innerHeight / 2) * 0.02}px)`,
          }}
        />
        
        <motion.h1 
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Your Business, <br />Powered by AI
        </motion.h1>
        
        <motion.p 
          className="text-lg md:text-xl text-white/80 max-w-2xl mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Cut costs by 60% while delivering 24/7 customer support. Join thousands of businesses using AI agents to scale their operations without scaling their team.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 text-lg px-8"
            onClick={() => handleAuth('signup')}
          >
            Get Started <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-white/20 hover:bg-white/10 text-white text-lg px-8"
            onClick={() => handleAuth('login')}
          >
            Login
          </Button>
        </motion.div>
      </motion.div>

      {/* Bento Grid Section */}
      <div className="relative z-10 px-4 py-20 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Transform Your Customer Service</h2>
        <p className="text-white/60 text-center mb-16 max-w-2xl mx-auto">
          Our AI agents handle customer inquiries 24/7, learning and improving with every interaction
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "60% Cost Reduction",
              description: "Reduce customer service costs while maintaining quality. Our AI agents handle unlimited conversations simultaneously.",
              icon: <Zap className="h-6 w-6" />,
              gradient: "from-green-500/20 to-emerald-500/20"
            },
            {
              title: "24/7 Availability",
              description: "Never miss a customer inquiry. AI agents are always online, responding instantly at any time of day.",
              icon: <Globe2 className="h-6 w-6" />,
              gradient: "from-blue-500/20 to-purple-500/20"
            },
            {
              title: "Human-Like Interactions",
              description: "Advanced language models ensure conversations feel natural and personalized to each customer.",
              icon: <MessageSquare className="h-6 w-6" />,
              gradient: "from-pink-500/20 to-rose-500/20"
            },
            {
              title: "Easy Integration",
              description: "Connect with your existing tools in minutes. Works with Slack, WhatsApp, email, and more.",
              icon: <Building2 className="h-6 w-6" />,
              gradient: "from-orange-500/20 to-red-500/20"
            },
            {
              title: "Smart Learning",
              description: "AI agents learn from every interaction, continuously improving their responses and effectiveness.",
              icon: <Bot className="h-6 w-6" />,
              gradient: "from-violet-500/20 to-indigo-500/20"
            },
            {
              title: "Real-Time Analytics",
              description: "Track performance, customer satisfaction, and identify trends with detailed analytics.",
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
              <Card className="relative overflow-hidden backdrop-blur-xl bg-white/5 border-white/10 p-6 h-full hover:bg-white/10 transition-colors group">
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-20 group-hover:opacity-30 transition-opacity`} />
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

      {/* Trust Banner */}
      <div className="relative z-10 py-12 text-center bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
              <Shield className="h-4 w-4 text-green-400" />
              <span className="text-sm text-white/70">Enterprise-grade security</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-white/70">99.9% Uptime</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
              <Globe2 className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-white/70">Used by 1000+ companies</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
