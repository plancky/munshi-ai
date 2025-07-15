"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { config } from "@/app/config";
import { buttonVariants } from "@/components/ui/button";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/ssr";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {}

export default function HeroSection({ ...props }: SectionProps) {
    return (
        <section {...props}>
<<<<<<< HEAD
            <div className="min-h-screen flex items-center justify-center px-4 lg:px-8 pt-24 lg:pt-32">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Column - Content */}
                    <div className="text-center lg:text-left">
                        <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
                            Finally, transcription that doesn&apos;t suck
                        </h1>
                        <p className="text-lg lg:text-xl text-muted-foreground mb-4">
=======
            <div className="min-h-screen flex flex-col items-center justify-center px-4 lg:px-8 pt-32">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left Column - Content */}
                    <div className="text-center lg:text-left">
                        <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-6 leading-tight">
                            Finally, transcription that doesn&apos;t suck
                        </h1>
                        <p className="text-base lg:text-lg text-muted-foreground mb-8 max-w-2xl">
>>>>>>> origin/main
                            Drop your audio, get perfect text. Works with interviews, meetings, podcasts, lectures—anything with words.
                        </p>
                        
                        {/* CTA Button */}
                        <div className="mb-8">
                            <Link
                                prefetch
                                className={buttonVariants({
                                    variant: "default",
                                    size: "lg",
                                })}
                                href={config.links["ask-munshi"].href}
                            >
                                <span className="flex gap-2 items-center">
                                    {config.links["ask-munshi"].name}
                                    <ArrowSquareOutIcon size={18} />
                                </span>
                            </Link>
                        </div>
                        
                    </div>

                    {/* Right Column - Animated Visual Demo */}
                    <AnimatedDemo />
<<<<<<< HEAD
=======
                </div>
                
                {/* Credits Section */}
                <div className="text-center mb-4 mt-16">
                    <p className="text-sm text-muted-foreground">
                        Created with ❤️ by{" "}
                        <a 
                            href="https://www.linkedin.com/in/corechirag/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-foreground hover:text-primary transition-colors duration-200"
                        >
                            CG
                        </a>
                        {" × "}
                        <a 
                            href="https://www.linkedin.com/in/shashvat817/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-foreground hover:text-primary transition-colors duration-200"
                        >
                            SJ
                        </a>
                    </p>
>>>>>>> origin/main
                </div>
            </div>
        </section>
    );
}

// Animated Demo Component
function AnimatedDemo() {
    const [stage, setStage] = useState<'initial' | 'processing' | 'typing' | 'complete'>('initial');
    const [progress, setProgress] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [showSummary, setShowSummary] = useState(false);
    
    const fullText = '"Welcome to today\'s meeting. Let\'s start by reviewing the quarterly results..."';
    
    useEffect(() => {
        const animationCycle = () => {
            // Reset state
            setStage('initial');
            setProgress(0);
            setDisplayedText('');
            setShowSummary(false);
            
            // Start processing after 1s
            setTimeout(() => {
                setStage('processing');
                
                // Progress animation
                const progressInterval = setInterval(() => {
                    setProgress(prev => {
                        if (prev >= 100) {
                            clearInterval(progressInterval);
                            // Start typing
                            setTimeout(() => {
                                setStage('typing');
                                let currentIndex = 0;
                                
                                const typeInterval = setInterval(() => {
                                    if (currentIndex <= fullText.length) {
                                        setDisplayedText(fullText.slice(0, currentIndex));
                                        currentIndex++;
                                    } else {
                                        clearInterval(typeInterval);
                                        setStage('complete');
                                        // Show summary after typing completes
                                        setTimeout(() => {
                                            setShowSummary(true);
                                        }, 500);
                                    }
                                }, 50); // Typing speed
                            }, 500);
                            return 100;
                        }
                        return prev + 2;
                    });
                }, 30); // Progress speed
            }, 1000);
        };
        
        // Start first cycle
        animationCycle();
        
<<<<<<< HEAD
        // Set up repeating cycle every 8 seconds
        const cycleInterval = setInterval(animationCycle, 8000);
        
        return () => clearInterval(cycleInterval);
=======
        return () => {};
>>>>>>> origin/main
    }, [fullText]);
    
    return (
        <div className="relative">
<<<<<<< HEAD
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <div className="space-y-4">
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Before</div>
                    <div className="bg-muted rounded-md p-4 min-h-[80px] flex flex-col gap-2">
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <div className="w-8 h-8 bg-muted-foreground/20 rounded flex items-center justify-center">🎵</div>
                            <span className="text-sm">audio_file_final_v3.mp3</span>
=======
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="space-y-5">
                    <div className="text-sm font-semibold text-muted-foreground">Before</div>
                    <div className="bg-muted rounded-lg p-4 min-h-[80px] flex flex-col gap-3">
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <div className="w-8 h-8 bg-muted-foreground/20 rounded-lg flex items-center justify-center">🎵</div>
                            <span className="text-sm font-medium">audio_file_final_v3.mp3</span>
>>>>>>> origin/main
                        </div>
                        
                        {/* Progress bar */}
                        {stage === 'processing' && (
<<<<<<< HEAD
                            <div className="w-full bg-muted-foreground/20 rounded-full h-2 mt-2">
=======
                            <div className="w-full bg-muted-foreground/20 rounded-full h-2">
>>>>>>> origin/main
                                <div 
                                    className="bg-primary h-2 rounded-full transition-all duration-75 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}
                    </div>
                    
<<<<<<< HEAD
                    <div className="flex justify-center py-2">
                        <ArrowSquareOutIcon size={24} className="text-primary transform rotate-90" />
                    </div>
                    
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">After</div>
                    <div className="bg-background border border-border rounded-md p-4 min-h-[120px]">
                        <div className="space-y-2 text-sm text-foreground">
                            {stage !== 'initial' && (
                                <p className="min-h-[1.25rem]">
=======
                    <div className="flex justify-center py-1">
                        <ArrowSquareOutIcon size={20} className="text-primary transform rotate-90" />
                    </div>
                    
                    <div className="text-sm font-semibold text-muted-foreground">After</div>
                    <div className="bg-background border border-border rounded-lg p-4 min-h-[120px]">
                        <div className="space-y-3 text-sm text-foreground">
                            {stage !== 'initial' && (
                                <p className="min-h-[1.25rem] leading-relaxed">
>>>>>>> origin/main
                                    {displayedText}
                                    {stage === 'typing' && <span className="animate-pulse">|</span>}
                                </p>
                            )}
                            {showSummary && (
<<<<<<< HEAD
                                <div className="text-xs text-muted-foreground pt-2 border-t border-border animate-in fade-in duration-500">
=======
                                <div className="text-xs text-muted-foreground pt-3 border-t border-border animate-in fade-in duration-500">
>>>>>>> origin/main
                                    ✨ Summary: Discussion of Q3 performance metrics and strategic planning for Q4.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
