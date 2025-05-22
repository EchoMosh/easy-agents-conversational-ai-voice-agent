"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Globe, PhoneIncoming, PhoneOutgoing, Send, Target, UploadCloud, XCircle, FileText } from "lucide-react";

type CallType = 'inbound' | 'outbound'; 
type CallObjective = 'survey' | 'qualify' | 'support' | 'appointment' | 'custom'; 
type Language = 'english-us' | 'english-uk' | 'spanish' | 'french' | 'german'; 

export function EnhancedPlaceholdersAndVanishInput({
  placeholders,
  onChange,
  onSubmit,
}: {
  placeholders: string[];
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (value: string, callType: string, callObjective?: string, language?: string, file?: File, fileContent?: string) => void;
}) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [callType, setCallType] = useState<CallType>('outbound'); 
  const [callObjective, setCallObjective] = useState<CallObjective>('qualify'); 
  const [language, setLanguage] = useState<Language>('english-us'); 
  
  const [objectiveDropdownOpen, setObjectiveDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [callTypeDropdownOpen, setCallTypeDropdownOpen] = useState(false);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContentForPreview, setFileContentForPreview] = useState<string | null>(null); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [value, setValue] = useState(""); 
  const [animating, setAnimating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const newDataRef = useRef<any[]>([]);

  const startPlaceholderAnimation = () => {
    if (!value && !uploadedFile && !intervalRef.current) { // Start only if no input and not already running
      intervalRef.current = setInterval(() => {
        setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
      }, 7000);
    }
  };

  const stopPlaceholderAnimation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  
  useEffect(() => {
    startPlaceholderAnimation();
    return () => stopPlaceholderAnimation();
  }, [placeholders]); // Initial setup

  useEffect(() => { // Control animation based on input
    if (value || uploadedFile) {
      stopPlaceholderAnimation();
    } else {
      startPlaceholderAnimation();
    }
  }, [value, uploadedFile]);


  const handleVisibilityChange = () => {
    if (document.visibilityState !== "visible") {
      stopPlaceholderAnimation();
    } else {
      startPlaceholderAnimation(); // Will only start if conditions are met
    }
  };

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [value, uploadedFile]); // Ensure visibility change respects current input state
  
  const draw = useCallback(() => {
    const textToDraw = value || uploadedFile?.name || "";
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 800;
    ctx.clearRect(0, 0, 800, 800);
    
    let fontSize = 16; 
    let fontFamily = "sans-serif"; 

    if (textareaRef.current && !uploadedFile) {
        const computedStyles = getComputedStyle(textareaRef.current);
        fontSize = parseFloat(computedStyles.getPropertyValue("font-size"));
        fontFamily = computedStyles.fontFamily;
    }
    
    ctx.font = `${fontSize * 2}px ${fontFamily}`;
    ctx.fillStyle = "#FFF";
    ctx.fillText(textToDraw, 16, 40);

    const imageData = ctx.getImageData(0, 0, 800, 800);
    const pixelData = imageData.data;
    const newData: any[] = [];
    for (let t = 0; t < 800; t++) {
      let i = 4 * t * 800;
      for (let n = 0; n < 800; n++) {
        let e = i + 4 * n;
        if (pixelData[e] !== 0 && pixelData[e + 1] !== 0 && pixelData[e + 2] !== 0) {
          newData.push({ x: n, y: t, color: [pixelData[e], pixelData[e + 1], pixelData[e + 2], pixelData[e + 3]] });
        }
      }
    }
    newDataRef.current = newData.map(({ x, y, color }) => ({ x, y, r: 1, color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})` }));
  }, [value, uploadedFile]);

  const animate = (start: number) => {
    const animateFrame = (pos: number = 0) => {
      requestAnimationFrame(() => {
        if (newDataRef.current.length > 0) {
            const newArr = [];
            for (let i = 0; i < newDataRef.current.length; i++) {
              const current = newDataRef.current[i];
              if (current.x < pos) newArr.push(current);
              else {
                if (current.r <= 0) { current.r = 0; continue; }
                current.x += Math.random() > 0.5 ? 1 : -1;
                current.y += Math.random() > 0.5 ? 1 : -1;
                current.r -= 0.1 * Math.random();
                newArr.push(current);
              }
            }
            newDataRef.current = newArr;
            const ctx = canvasRef.current?.getContext("2d");
            if (ctx) {
              ctx.clearRect(pos, 0, 800, 800);
              newDataRef.current.forEach((t) => {
                const { x: n, y: i, r: s, color: color } = t;
                if (n > pos) { ctx.beginPath(); ctx.rect(n, i, s, s); ctx.fillStyle = color; ctx.strokeStyle = color; ctx.stroke(); }
              });
            }
        }

        if (newDataRef.current.length > 0 && pos > -800) {
            animateFrame(pos - 16);
        } else {
          setValue(""); 
          setAnimating(false); 
        }
      });
    };
    animateFrame(start);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setValue(""); 
      stopPlaceholderAnimation();
      if (file.type === "text/plain" || file.type === "text/markdown" || file.type.includes("text")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFileContentForPreview(e.target?.result as string);
        };
        reader.readAsText(file);
      } else {
        setFileContentForPreview(null); 
      }
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setFileContentForPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = ""; 
    if (!value) startPlaceholderAnimation();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !animating) { e.preventDefault(); vanishAndSubmit(); }
  };

  const vanishAndSubmit = () => {
    if (!callType || !callObjective || !language) { console.warn("A selection is missing."); return; }
    if (!value.trim() && !uploadedFile) { console.warn("No prompt or file provided."); return; }

    setAnimating(true);
    draw(); 
    const maxX = newDataRef.current.reduce((prev, current) => (current.x > prev ? current.x : prev), 0);
    animate(maxX); 
    onSubmit(value, callType, callObjective, language, uploadedFile || undefined, fileContentForPreview || undefined);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (value.trim() || uploadedFile) vanishAndSubmit();
    else console.log("Please enter a prompt or upload a file.");
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetElement = event.target as Element;
      if (objectiveDropdownOpen && !targetElement.closest('#call-objective-selector-wrapper')) setObjectiveDropdownOpen(false);
      if (languageDropdownOpen && !targetElement.closest('#language-selector-wrapper')) setLanguageDropdownOpen(false);
      if (callTypeDropdownOpen && !targetElement.closest('#call-type-selector-wrapper')) setCallTypeDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [objectiveDropdownOpen, languageDropdownOpen, callTypeDropdownOpen]);

  const getCallTypeDisplay = (type: CallType) => {
    if (type === 'inbound') return { text: 'Inbound', icon: <PhoneIncoming className="h-4 w-4 mr-2 flex-shrink-0" /> };
    return { text: 'Outbound', icon: <PhoneOutgoing className="h-4 w-4 mr-2 flex-shrink-0" /> };
  };
  
  const languageTextMap: Record<Language, string> = {
    'english-us': 'English (US)', 'english-uk': 'English (UK)', 'spanish': 'Spanish', 'french': 'French', 'german': 'German',
  };
  const objectiveTextMap: Record<CallObjective, string> = { 
    'survey': 'Survey', 'qualify': 'Qualify', 'support': 'Support', 'appointment': 'Appointment', 'custom': 'Custom',
  }
  const objectiveVerbMap: Record<CallObjective, string> = {
    'survey': 'conduct surveys with', 'qualify': 'qualify', 'support': 'provide support to', 
    'appointment': 'book appointments for', 'custom': 'achieve a custom objective with',
  };

  const summaryText = useMemo(() => {
    const objectiveVerb = objectiveVerbMap[callObjective];
    const languageStr = languageTextMap[language];
    const callTypeStr = callType.charAt(0).toUpperCase() + callType.slice(1);
    return `This agent will ${objectiveVerb} leads in ${languageStr} via ${callTypeStr} calls.`;
  }, [callObjective, language, callType]);

  const dropdownButtonClass = "flex bg-neutral-800/60 rounded-lg p-1 h-[36px] cursor-pointer hover:bg-neutral-700/60 transition-colors items-center justify-between w-full";
  const dropdownLabelClass = "block text-xs text-neutral-400 mb-1";
  const dropdownTextClass = "flex items-center gap-2 text-sm font-medium text-neutral-300 px-1 truncate";
  const dropdownChevronClass = "h-4 w-4 text-neutral-400 mr-1 flex-shrink-0";
  const dropdownMenuClass = "absolute z-20 mt-1 w-full rounded-md bg-neutral-800 shadow-lg border border-neutral-700 py-1";
  const dropdownItemClass = "flex w-full items-center px-3 py-2 text-sm text-left hover:bg-neutral-700";

  return (
    <div className="w-full">
      <form
        className={cn("w-full relative bg-neutral-900/80 rounded-2xl flex flex-col transition-all duration-300 ease-in-out min-h-[260px] border border-neutral-700/50 shadow-lg shadow-blue-500/5")}
        onSubmit={handleFormSubmit}
      >
        <div className="relative flex-grow p-4 pb-2">
          <canvas className={cn("absolute pointer-events-none text-base transform scale-50 top-4 left-4 origin-top-left", !animating ? "opacity-0" : "opacity-100")} ref={canvasRef} />
          {!uploadedFile ? (
            <>
              <textarea
                rows={3}
                onChange={(e) => {
                  if (!animating) { setValue(e.target.value); onChange && onChange(e); }
                  if (e.target.value) stopPlaceholderAnimation(); else startPlaceholderAnimation();
                }}
                onKeyDown={handleKeyDown}
                ref={textareaRef}
                value={value}
                className={cn("w-full h-full relative text-lg sm:text-xl z-10 border-none text-neutral-100 bg-transparent focus:outline-none focus:ring-0 resize-none placeholder-neutral-500", animating && "text-transparent")}
                placeholder="" 
              />
              <AnimatePresence mode="wait">
                {!value && !animating && !uploadedFile && (
                  <motion.p initial={{ y: 5, opacity: 0 }} key={`current-placeholder-${currentPlaceholder}`} animate={{ y: 0, opacity: 1 }} exit={{ y: -15, opacity: 0 }} transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="absolute top-4 left-4 text-gray-400 text-lg sm:text-xl font-normal pointer-events-none w-[calc(100%-2rem)] overflow-hidden text-left" 
                    style={{ maxHeight: 'calc(100% - 2rem)', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflowWrap: 'break-word' }}
                  > {placeholders[currentPlaceholder]} </motion.p>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300 p-4 min-h-[80px]">
              <FileText size={28} className="text-blue-400 mb-2" />
              <p className="text-sm font-medium mb-1 truncate max-w-full">{uploadedFile.name}</p>
              <p className="text-xs text-neutral-400">({(uploadedFile.size / 1024).toFixed(2)} KB)</p>
              {fileContentForPreview && uploadedFile.type.startsWith('text') && (
                <p className="text-xs text-neutral-500 mt-1 italic w-full truncate">Preview: {fileContentForPreview.substring(0,70)}...</p>
              )}
               <button type="button" onClick={clearFile} className="mt-3 text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                <XCircle size={14} /> Remove file
              </button>
            </div>
          )}
        </div>
        
        <div className="px-4 pb-2 flex justify-center">
            <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300 rounded-md transition-colors">
                <UploadCloud size={16} /> {uploadedFile ? "Change File" : "Upload Script/Audio"}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.md,.mp3,.wav,.m4a,.ogg,.flac" />
        </div>

        <div className="px-4 pt-1 pb-2 text-xs text-neutral-400 text-center md:text-left"> {summaryText} </div>

        <div className="p-3 border-t border-neutral-700/80 min-h-[70px] relative">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div id="call-objective-selector-wrapper" className="relative group w-full md:flex-1">
              <label htmlFor="call-objective-selector" className={dropdownLabelClass}>Objective</label>
              <div id="call-objective-selector" className={dropdownButtonClass} onClick={() => setObjectiveDropdownOpen(!objectiveDropdownOpen)}>
                <div className={dropdownTextClass}><Target className="h-4 w-4 flex-shrink-0" /> <span className="truncate">{objectiveTextMap[callObjective]}</span></div> <ChevronDown className={dropdownChevronClass} />
              </div>
              {objectiveDropdownOpen && <div id="objective-dropdown" className={dropdownMenuClass}>
                {(Object.keys(objectiveTextMap) as CallObjective[]).map(item => <button key={item} type="button" className={cn(dropdownItemClass, callObjective === item ? "bg-blue-600/20 text-white" : "text-neutral-300")} onClick={() => { setCallObjective(item); setObjectiveDropdownOpen(false); }}>{objectiveTextMap[item]}</button>)}
              </div>}
            </div>
            <div id="language-selector-wrapper" className="relative group w-full md:flex-1">
              <label htmlFor="language-selector" className={dropdownLabelClass}>Language</label>
              <div id="language-selector" className={dropdownButtonClass} onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}>
                <div className={dropdownTextClass}><Globe className="h-4 w-4 flex-shrink-0" /> <span className="truncate">{languageTextMap[language]} {language === 'english-us' ? '🇺🇸' : language === 'english-uk' ? '🇬🇧' : language === 'spanish' ? '🇪🇸' : language === 'french' ? '🇫🇷' : '🇩🇪'}</span></div> <ChevronDown className={dropdownChevronClass} />
              </div>
              {languageDropdownOpen && <div id="language-dropdown" className={dropdownMenuClass}>
                {(Object.keys(languageTextMap) as Language[]).map(item => <button key={item} type="button" className={cn(dropdownItemClass, language === item ? "bg-blue-600/20 text-white" : "text-neutral-300")} onClick={() => { setLanguage(item); setLanguageDropdownOpen(false); }}>{languageTextMap[item]} {item === 'english-us' ? '🇺🇸' : item === 'english-uk' ? '🇬🇧' : item === 'spanish' ? '🇪🇸' : item === 'french' ? '🇫🇷' : '🇩🇪'}</button>)}
              </div>}
            </div>
            <div id="call-type-selector-wrapper" className="relative group w-full md:flex-1">
              <label htmlFor="call-type-selector" className={dropdownLabelClass}>Call Type</label>
              <div id="call-type-selector" className={dropdownButtonClass} onClick={() => setCallTypeDropdownOpen(!callTypeDropdownOpen)}>
                <div className={dropdownTextClass}>{getCallTypeDisplay(callType).icon} <span className="truncate">{getCallTypeDisplay(callType).text}</span></div> <ChevronDown className={dropdownChevronClass} />
              </div>
              {callTypeDropdownOpen && <div id="call-type-dropdown" className={dropdownMenuClass}>
                {(['outbound', 'inbound'] as CallType[]).map(item => <button key={item} type="button" className={cn(dropdownItemClass, callType === item ? "bg-blue-600/20 text-white" : "text-neutral-300")} onClick={() => { setCallType(item); setCallTypeDropdownOpen(false); }}>{getCallTypeDisplay(item).icon} {getCallTypeDisplay(item).text}</button>)}
              </div>}
            </div>
            <div className="w-full md:w-auto flex flex-col justify-end md:h-[calc(36px+0.25rem+0.875rem)] pt-2 md:pt-0"> 
                 <button type="submit" disabled={(!value.trim() && !uploadedFile) || animating || !callType || !callObjective}
                    className={cn("p-2.5 h-[36px] w-full md:w-[36px] rounded-lg transition-all duration-300 ease-in-out focus:outline-none flex items-center justify-center",
                        (value.trim() || uploadedFile) && !animating && callType && callObjective ? "bg-lime-400 hover:bg-lime-500 text-black" : "bg-neutral-800 text-neutral-500 cursor-not-allowed")}
                    title="Generate AI Agent"> <Send className="h-4 w-4" /> </button>
            </div>
          </div>
        </div>
      </form>
      <style>{` @keyframes shake {0% { transform: translateX(0); } 25% { transform: translateX(-5px); } 50% { transform: translateX(5px); } 75% { transform: translateX(-5px); } 100% { transform: translateX(0); }} .shake-animation { animation: shake 0.5s ease-in-out; } `}</style>
    </div>
  );
}
