"use client";
import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause } from 'lucide-react';
import { Button } from './ui/button';

interface AudioVisualizerProps {
  audioUrl: string;
  className?: string;
}

export default function AudioVisualizer({ audioUrl, className = "" }: AudioVisualizerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (waveformRef.current) {
      // Initialize WaveSurfer
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'hsl(215, 20%, 65%)', // muted-foreground
        progressColor: 'hsl(213, 93%, 68%)', // primary
        cursorColor: 'hsl(213, 93%, 68%)', // primary
        barWidth: 2,
        barGap: 1,
        barRadius: 1,
        responsive: true,
        height: 60,
        normalize: true,
        backend: 'WebAudio',
      });

      // Load audio
      wavesurfer.current.load(audioUrl);

      // Event listeners
      wavesurfer.current.on('ready', () => {
        setDuration(wavesurfer.current?.getDuration() || 0);
      });

      wavesurfer.current.on('audioprocess', () => {
        setCurrentTime(wavesurfer.current?.getCurrentTime() || 0);
      });

      wavesurfer.current.on('play', () => {
        setIsPlaying(true);
      });

      wavesurfer.current.on('pause', () => {
        setIsPlaying(false);
      });

      wavesurfer.current.on('finish', () => {
        setIsPlaying(false);
      });
    }

    return () => {
      wavesurfer.current?.destroy();
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-muted rounded-lg border p-4 ${className}`}>
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <Button
          onClick={togglePlayPause}
          variant="default"
          size="icon"
          className="flex-shrink-0 w-10 h-10 rounded-full"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </Button>

        {/* Waveform Container */}
        <div className="flex-1 min-w-0">
          <div 
            ref={waveformRef} 
            className={`w-full ${isPlaying ? 'animate-pulse' : ''}`}
          />
        </div>

        {/* Time Display */}
        <div className="flex-shrink-0 text-sm text-muted-foreground font-mono min-w-[80px] text-right">
          <span>{formatTime(currentTime)}</span>
          <span className="mx-1">/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
} 