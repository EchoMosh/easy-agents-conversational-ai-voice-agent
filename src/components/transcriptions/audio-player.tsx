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
    <div className="w-full rounded-full bg-white dark:bg-slate-900 flex flex-col gap-1.5 shadow-sm p-1.5">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Player controls in a single row for a more minimal look */}
      <div className="flex items-center gap-4 px-5 py-2">
        {/* Play/Pause Button - Centered, larger, and prominent */}
        <Button 
          onClick={togglePlay} 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600 shadow-sm flex-shrink-0"
        >
          {isPlaying ? 
            <Pause className="h-5 w-5 text-white" /> : 
            <Play className="h-5 w-5 text-white ml-0.5" />
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
            [&>.SliderTrack>.SliderRange]:bg-blue-500 dark:[&>.SliderTrack>.SliderRange]:bg-blue-500
            [&>.SliderThumb]:h-3 [&>.SliderThumb]:w-3 [&>.SliderThumb]:border-0 [&>.SliderThumb]:bg-blue-500"
          />
          
          {/* Time display */}
          <div className="flex justify-between items-center">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono">
              {formatTime(currentTime)}
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => skip(-10)} variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <Rewind className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300" />
              </Button>
              <Button onClick={() => skip(10)} variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <Forward className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300" />
              </Button>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono ml-1">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Volume control */}
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0">
          <Volume2 className="h-4 w-4 text-slate-700 dark:text-slate-300" />
        </Button>
      </div>
    </div>
  )
}
