
import { motion } from "framer-motion";
import { MicVocal, Radio, Waves, Headphones } from "lucide-react";

export function AIVoiceLoader() {
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center min-h-screen w-full">
      <motion.div 
        className="relative flex items-center justify-center w-32 h-32 rounded-full bg-primary/10"
        animate={{
          scale: [1, 1.1, 1],
          boxShadow: [
            "0 0 0 0 rgba(100, 110, 255, 0.5)",
            "0 0 0 30px rgba(100, 110, 255, 0)",
            "0 0 0 0 rgba(100, 110, 255, 0)"
          ]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          repeatType: "loop"
        }}
      >
        <MicVocal className="w-16 h-16 text-primary" />
      </motion.div>
      
      <div className="relative flex items-center justify-center w-full h-20 my-12">
        {/* Voice waves - center */}
        <motion.div
          className="flex items-center space-x-1.5"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 bg-primary rounded-full"
              animate={{ 
                height: [15, 40 + Math.random() * 20, 15] 
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

        {/* Headphone pulses - left */}
        <motion.div 
          className="absolute left-1/4"
          animate={{ 
            opacity: [0.2, 0.7, 0.2],
            scale: [0.9, 1.1, 0.9]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Headphones className="w-8 h-8 text-primary/70" />
        </motion.div>

        {/* Radio waves - right */}
        <motion.div 
          className="absolute right-1/4"
          animate={{ 
            opacity: [0.3, 0.8, 0.3],
            rotate: [-5, 5, -5]
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <Waves className="w-8 h-8 text-primary/70" />
        </motion.div>
      </div>
      
      <div className="text-center space-y-4">
        <motion.p 
          className="text-2xl font-medium text-primary"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          Creating AI Voice Agent
        </motion.p>
        <p className="text-base text-muted-foreground">
          This might take a moment...
        </p>
        <motion.div
          className="mt-8 flex space-x-1"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ 
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                delay: i * 0.3
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
