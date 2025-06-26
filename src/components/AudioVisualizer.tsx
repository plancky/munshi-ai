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
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Reset loading state when audioUrl changes
    setIsLoading(true);
    setIsReady(false);
    setIsPlaying(false);
    
    if (waveformRef.current) {
      // Initialize WaveSurfer with performance optimizations
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'hsl(215, 20%, 65%)', // muted-foreground
        progressColor: 'hsl(213, 93%, 68%)', // primary
        cursorColor: 'hsl(213, 93%, 68%)', // primary
        barWidth: 3,           // Wider bars = fewer DOM elements
        barGap: 2,             // Larger gaps = fewer bars
        barRadius: 1,
        height: 60,
        normalize: false,      // Skip normalization for faster loading
        backend: 'MediaElement', // Much faster than WebAudio for long files
        mediaControls: false,  // Disable native controls
        interact: true,        // Keep seeking functionality
        hideScrollbar: true,   // Clean UI
        minPxPerSec: 20,       // Lower resolution = faster rendering
      });

      // Event listeners
      wavesurfer.current.on('ready', () => {
        setDuration(wavesurfer.current?.getDuration() || 0);
        setIsLoading(false);
        setIsReady(true);
      });

      wavesurfer.current.on('loading', (progress) => {
        if (progress < 100) {
          setIsLoading(true);
        }
      });

      // Add error handler for loading failures
      wavesurfer.current.on('error', (error) => {
        console.warn('WaveSurfer loading error:', error);
        setIsLoading(false);
        setIsReady(false);
      });

      // Load audio (put this after event listeners)
      wavesurfer.current.load(audioUrl);

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
      // Safe cleanup: stop playback and destroy WaveSurfer instance
      try {
        if (wavesurfer.current) {
          wavesurfer.current.pause(); // Stop any playback first
          wavesurfer.current.destroy();
        }
      } catch (error) {
        // Ignore cleanup errors - component is unmounting anyway
        console.warn('WaveSurfer cleanup warning:', error);
      }
      wavesurfer.current = null;
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
          disabled={!isReady}
          className="flex-shrink-0 w-10 h-10 rounded-full"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </Button>

        {/* Waveform Container */}
        <div className="flex-1 min-w-0 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              Loading waveform...
            </div>
          )}
          <div 
            ref={waveformRef} 
            className={`w-full transition-opacity duration-300 ${
              isLoading ? 'opacity-30' : 'opacity-100'
            }`}
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