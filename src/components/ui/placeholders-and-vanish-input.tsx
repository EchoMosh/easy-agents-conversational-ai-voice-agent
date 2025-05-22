"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function PlaceholdersAndVanishInput({
  placeholders,
  onChange,
  onSubmit,
}: {
  placeholders: string[];
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (value: string) => void;
}) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startAnimation = () => {
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 5000); // Increased interval to 5 seconds
  };
  const handleVisibilityChange = () => {
    if (document.visibilityState !== "visible" && intervalRef.current) {
      clearInterval(intervalRef.current); // Clear the interval when the tab is not visible
      intervalRef.current = null;
    } else if (document.visibilityState === "visible") {
      startAnimation(); // Restart the interval when the tab becomes visible
    }
  };

  useEffect(() => {
    startAnimation();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [placeholders]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const newDataRef = useRef<any[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Changed from inputRef
  const [value, setValue] = useState("");
  const [animating, setAnimating] = useState(false);

  const draw = useCallback(() => {
    if (!textareaRef.current) return; // Changed from inputRef
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 800;
    ctx.clearRect(0, 0, 800, 800);
    const computedStyles = getComputedStyle(textareaRef.current); // Changed from inputRef

    const fontSize = parseFloat(computedStyles.getPropertyValue("font-size"));
    ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;
    ctx.fillStyle = "#FFF";
    ctx.fillText(value, 16, 40);

    const imageData = ctx.getImageData(0, 0, 800, 800);
    const pixelData = imageData.data;
    const newData: any[] = [];

    for (let t = 0; t < 800; t++) {
      let i = 4 * t * 800;
      for (let n = 0; n < 800; n++) {
        let e = i + 4 * n;
        if (
          pixelData[e] !== 0 &&
          pixelData[e + 1] !== 0 &&
          pixelData[e + 2] !== 0
        ) {
          newData.push({
            x: n,
            y: t,
            color: [
              pixelData[e],
              pixelData[e + 1],
              pixelData[e + 2],
              pixelData[e + 3],
            ],
          });
        }
      }
    }

    newDataRef.current = newData.map(({ x, y, color }) => ({
      x,
      y,
      r: 1,
      color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`,
    }));
  }, [value]);

  useEffect(() => {
    draw();
  }, [value, draw]);

  const animate = (start: number) => {
    const animateFrame = (pos: number = 0) => {
      requestAnimationFrame(() => {
        const newArr = [];
        for (let i = 0; i < newDataRef.current.length; i++) {
          const current = newDataRef.current[i];
          if (current.x < pos) {
            newArr.push(current);
          } else {
            if (current.r <= 0) {
              current.r = 0;
              continue;
            }
            current.x += Math.random() > 0.5 ? 1 : -1;
            current.y += Math.random() > 0.5 ? 1 : -1;
            current.r -= 0.1 * Math.random(); // Increased shrink rate
            newArr.push(current);
          }
        }
        newDataRef.current = newArr;
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.clearRect(pos, 0, 800, 800);
          newDataRef.current.forEach((t) => {
            const { x: n, y: i, r: s, color: color } = t;
            if (n > pos) {
              ctx.beginPath();
              ctx.rect(n, i, s, s);
              ctx.fillStyle = color;
              ctx.strokeStyle = color;
              ctx.stroke();
            }
          });
        }
        if (newDataRef.current.length > 0) {
          animateFrame(pos - 16); // Increased step for faster animation
        } else {
          setValue("");
          setAnimating(false);
        }
      });
    };
    animateFrame(start);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    console.log("Key down in textarea:", e.key);
    if (e.key === "Enter" && !e.shiftKey && !animating) {
      console.log("Enter pressed - preventing default and submitting");
      e.preventDefault(); // Prevent newline in textarea on submit
      vanishAndSubmit();
    }
  };

  const vanishAndSubmit = () => {
    console.log("vanishAndSubmit called, starting animation");
    setAnimating(true);
    draw();

    const currentValue = textareaRef.current?.value || "";
    if (currentValue && textareaRef.current) {
      console.log("Current input value:", currentValue);
      const maxX = newDataRef.current.reduce(
        (prev, current) => (current.x > prev ? current.x : prev),
        0
      );
      animate(maxX);
      
      // Call onSubmit with the actual text value
      console.log("Calling onSubmit with value:", currentValue);
      onSubmit && onSubmit(currentValue);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    console.log("Form submit event triggered");
    e.preventDefault();
    if (textareaRef.current?.value) {
      vanishAndSubmit();
    }
  };
  return (
    <form
      className={cn(
        "w-full relative bg-neutral-900/80 p-2 rounded-full flex items-center transition-all duration-300 ease-in-out min-h-[68px]" // Changed to rounded-full and bg-neutral-900/80
      )}
      onSubmit={handleSubmit}
    >
      <canvas
        className={cn(
          "absolute pointer-events-none text-base transform scale-50 top-[25%] left-4 sm:left-6 origin-top-left",
          !animating ? "opacity-0" : "opacity-100"
        )}
        ref={canvasRef}
      />
      <textarea
        rows={1}
        onChange={(e) => {
          if (!animating) {
            const target = e.target as HTMLTextAreaElement;
            setValue(target.value);
            // @ts-ignore
            onChange && onChange(e);

            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
              textareaRef.current.style.height = `${target.scrollHeight}px`;
            }
          }
        }}
        onKeyDown={handleKeyDown}
        ref={textareaRef}
        value={value}
        className={cn(
          "flex-grow relative text-base sm:text-lg z-50 border-none text-neutral-100 bg-transparent focus:outline-none focus:ring-0 pl-4 pr-[3.25rem] py-2.5 resize-none", // Increased pr for button space
          animating && "text-transparent"
        )}
        placeholder=""
      />

      <button
        type="submit"
        disabled={!value || animating}
        className={cn(
          "absolute right-3 p-2.5 rounded-full transition-all duration-300 ease-in-out focus:outline-none", // Changed to rounded-full and removed ring styles
          value && !animating
            ? "bg-lime-400 hover:bg-lime-500 text-black" // Changed from yellow to lime color
            : "bg-neutral-800 text-neutral-500 cursor-not-allowed",
          "flex items-center justify-center w-10 h-10" // Larger button
        )}
      >
        <svg // Paper airplane icon instead of chevron
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 2L11 13" />
          <path d="M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      </button>

      <div className="absolute inset-0 flex items-center rounded-full pointer-events-none"> {/* Changed to items-center and removed pt-2.5 */}
        <AnimatePresence mode="wait">
          {!value && (
            <motion.p
              initial={{
                y: 5,
                opacity: 0,
              }}
              key={`current-placeholder-${currentPlaceholder}`}
              animate={{
                y: 0,
                opacity: 1,
              }}
              exit={{
                y: -15,
                opacity: 0,
              }}
              transition={{
                duration: 0.6,
                ease: "easeInOut",
              }}
              className="text-gray-400 text-base sm:text-lg font-normal pl-4 sm:pl-6 text-left w-[calc(100%-3.5rem)] truncate" // Changed text-neutral-500 to text-gray-400
            >
              {placeholders[currentPlaceholder]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
