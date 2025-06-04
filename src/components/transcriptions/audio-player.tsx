'use client'

import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Rewind,
  Forward,
} from "lucide-react"
import { useRef, useState, useEffect } from "react"

interface AudioPlayerProps {
  src: string;
}

export function AudioPlayer({ src }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    
    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
    }
  }, [])

  useEffect(() => {
    // Update the audio source if it changes
    const audio = audioRef.current
    if (!audio || !src) return
    
    audio.src = src
    audio.load()
  }, [src])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(e => console.warn("Audio play failed:", e))
    }
  }

  const seek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds))
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    // Changed to rounded-lg, adjusted background and padding for better integration
    <div className="w-full rounded-lg bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-1.5 p-3 border border-slate-200 dark:border-slate-700">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" /> {/* Kept audio tag hidden as it's controlled */}
      
      <div className="flex items-center gap-3 px-2"> {/* Adjusted gap and padding */}
        {/* Play/Pause Button */}
        <Button 
          onClick={togglePlay} 
          variant="ghost" // More subtle variant
          size="icon" 
          className="h-9 w-9 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex-shrink-0"
        >
          {isPlaying ? 
            <Pause className="h-4 w-4" /> : 
            <Play className="h-4 w-4" />
          }
        </Button>
        
        {/* Time and Slider Section */}
        <div className="flex-1 flex flex-col gap-1">
          {/* Progress Slider */}
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={seek}
            className="w-full [&>.SliderTrack]:h-1.5 [&>.SliderTrack]:bg-slate-200 dark:[&>.SliderTrack]:bg-slate-700
            [&>.SliderTrack>.SliderRange]:bg-slate-600 dark:[&>.SliderTrack>.SliderRange]:bg-slate-400 /* Adjusted slider color */
            [&>.SliderThumb]:h-3 [&>.SliderThumb]:w-3 [&>.SliderThumb]:border-0 [&>.SliderThumb]:bg-slate-700 dark:[&>.SliderThumb]:bg-slate-300" /* Adjusted thumb color */
          />
          
          {/* Time display */}
          <div className="flex justify-between items-center mt-1"> {/* Added mt-1 for spacing */}
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 font-sans"> {/* Changed to font-sans */}
              {formatTime(currentTime)}
            </div>
            <div className="flex items-center gap-1.5"> {/* Reduced gap */}
              <Button onClick={() => skip(-10)} variant="ghost" size="icon" className="h-6 w-6 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
                <Rewind className="h-3 w-3" />
              </Button>
              <Button onClick={() => skip(10)} variant="ghost" size="icon" className="h-6 w-6 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
                <Forward className="h-3 w-3" />
              </Button>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 font-sans ml-1"> {/* Changed to font-sans */}
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Volume control - can be made more subtle or integrated differently if needed */}
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex-shrink-0">
          <Volume2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
