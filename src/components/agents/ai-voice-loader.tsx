
import { motion } from "framer-motion";
import { Mic, Radio, Waves } from "lucide-react";

export function AIVoiceLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-8">
      <motion.div 
        className="relative flex items-center justify-center w-24 h-24 rounded-full bg-primary/10"
        animate={{
          scale: [1, 1.1, 1],
          boxShadow: [
            "0 0 0 0 rgba(100, 110, 255, 0.5)",
            "0 0 0 20px rgba(100, 110, 255, 0)",
            "0 0 0 0 rgba(100, 110, 255, 0)"
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "loop"
        }}
      >
        <Mic className="w-10 h-10 text-primary" />
      </motion.div>
      
      <div className="relative flex items-center justify-center w-full h-12">
        {/* Voice waves - center */}
        <motion.div
          className="flex items-center space-x-1"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-primary rounded-full"
              animate={{ 
                height: [15, 30 + Math.random() * 15, 15] 
              }}
              transition={{ 
                duration: 1.3,
                repeat: Infinity,
                repeatType: "reverse",
                delay: i * 0.1
              }}
            />
          ))}
        </motion.div>

        {/* Brain pulses - left */}
        <motion.div 
          className="absolute left-12"
          animate={{ opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Radio className="w-6 h-6 text-primary/70" />
        </motion.div>

        {/* Radio waves - right */}
        <motion.div 
          className="absolute right-12"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <Waves className="w-6 h-6 text-primary/70" />
        </motion.div>
      </div>
      
      <div className="text-center space-y-2">
        <motion.p 
          className="text-lg font-medium text-primary"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          Creating AI Voice Agent
        </motion.p>
        <p className="text-sm text-muted-foreground">
          This might take a moment...
        </p>
      </div>
    </div>
  );
}
