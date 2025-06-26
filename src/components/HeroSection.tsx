"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { config } from "@/app/config";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Logo from "@/logo/logo.svg?inline";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/ssr";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {}

export default function HeroSection({ ...props }: SectionProps) {
    return (
        <section {...props}>
            <div className="min-h-screen flex flex-col items-center justify-center px-4 lg:px-8">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center flex-1">
                    {/* Left Column - Content */}
                    <div className="text-center lg:text-left">
                        <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-6 leading-tight">
                            Finally, transcription that doesn&apos;t suck
                        </h1>
                        <p className="text-base lg:text-lg text-muted-foreground mb-8 max-w-2xl">
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
                </div>
                
                {/* Credits Section */}
                <div className="text-center mb-8">
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
        
        // Set up repeating cycle every 8 seconds
        const cycleInterval = setInterval(animationCycle, 8000);
        
        return () => clearInterval(cycleInterval);
    }, [fullText]);
    
    return (
        <div className="relative">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="space-y-5">
                    <div className="text-sm font-semibold text-muted-foreground">Before</div>
                    <div className="bg-muted rounded-lg p-4 min-h-[80px] flex flex-col gap-3">
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <div className="w-8 h-8 bg-muted-foreground/20 rounded-lg flex items-center justify-center">🎵</div>
                            <span className="text-sm font-medium">audio_file_final_v3.mp3</span>
                        </div>
                        
                        {/* Progress bar */}
                        {stage === 'processing' && (
                            <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                                <div 
                                    className="bg-primary h-2 rounded-full transition-all duration-75 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-center py-1">
                        <ArrowSquareOutIcon size={20} className="text-primary transform rotate-90" />
                    </div>
                    
                    <div className="text-sm font-semibold text-muted-foreground">After</div>
                    <div className="bg-background border border-border rounded-lg p-4 min-h-[120px]">
                        <div className="space-y-3 text-sm text-foreground">
                            {stage !== 'initial' && (
                                <p className="min-h-[1.25rem] leading-relaxed">
                                    {displayedText}
                                    {stage === 'typing' && <span className="animate-pulse">|</span>}
                                </p>
                            )}
                            {showSummary && (
                                <div className="text-xs text-muted-foreground pt-3 border-t border-border animate-in fade-in duration-500">
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
