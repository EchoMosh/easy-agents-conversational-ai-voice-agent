"use client";
import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils"; // Assuming cn is in @/lib/utils
import { SparklesCore } from "@/components/ui/sparkles";

type SpotlightProps = {
  className?: string;
  gradientFirst?: string;
  gradientSecond?: string;
  gradientThird?: string;
  translateY?: number;
  width?: number;
  height?: number;
  smallWidth?: number;
  duration?: number;
  xOffset?: number;
};

export const Spotlight = ({
  gradientFirst = "radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(210, 100%, 95%, .25) 0, hsla(210, 100%, 70%, .08) 40%, hsla(210, 100%, 45%, 0) 80%)",
  gradientSecond = "radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 95%, .18) 0, hsla(210, 100%, 70%, .08) 60%, transparent 100%)",
  gradientThird = "radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 90%, .12) 0, hsla(210, 100%, 60%, .06) 60%, transparent 100%)",
  translateY = -350,
  width = 660,
  height = 1500,
  smallWidth = 280,
  duration = 7,
  xOffset = 100,
  className,
}: SpotlightProps = {}) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      transition={{
        duration: 1.5,
      }}
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    >
      {/* Very subtle sparkles effect only in the spotlight area */}
      <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden z-30" style={{ clipPath: "polygon(0 0, 100% 0, 100% 40%, 0 40%)" }}>
        <SparklesCore
          id="spotlight-sparkles"
          background="transparent"
          particleColor="#d4e6ff"
          particleDensity={20}
          minSize={0.3}
          maxSize={1.0}
          speed={0.5}
          className="absolute top-0 left-0 right-0 w-full h-80 opacity-40"
        />
      </div>
      <motion.div
        animate={{
          x: [0, xOffset, 0],
        }}
        transition={{
          duration,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="absolute top-0 left-0 w-screen h-screen z-40 pointer-events-none"
      >
        <div
          style={{
            transform: `translateY(${translateY}px) rotate(-45deg)`,
            background: gradientFirst,
            width: `${width}px`,
            height: `${height}px`,
          }}
          className={`absolute top-0 left-0`}
        />

        <div
          style={{
            transform: "rotate(-45deg) translate(5%, -50%)",
            background: gradientSecond,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className={`absolute top-0 left-0 origin-top-left`}
        />

        <div
          style={{
            transform: "rotate(-45deg) translate(-180%, -70%)",
            background: gradientThird,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className={`absolute top-0 left-0 origin-top-left`}
        />
      </motion.div>

      <motion.div
        animate={{
          x: [0, -xOffset, 0],
        }}
        transition={{
          duration,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="absolute top-0 right-0 w-screen h-screen z-40 pointer-events-none"
      >
        <div
          style={{
            transform: `translateY(${translateY}px) rotate(45deg)`,
            background: gradientFirst,
            width: `${width}px`,
            height: `${height}px`,
          }}
          className={`absolute top-0 right-0`}
        />

        <div
          style={{
            transform: "rotate(45deg) translate(-5%, -50%)",
            background: gradientSecond,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className={`absolute top-0 right-0 origin-top-right`}
        />

        <div
          style={{
            transform: "rotate(45deg) translate(180%, -70%)",
            background: gradientThird,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className={`absolute top-0 right-0 origin-top-right`}
        />
      </motion.div>
    </motion.div>
  );
};
