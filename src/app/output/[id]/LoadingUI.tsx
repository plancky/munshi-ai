"use client";
import ClipboardCopy from "@/components/ClipboardCopy";
import { TRANSCRIPTION_STATUS } from "@/shared/constants";
import { CircleNotchIcon, WaveformIcon, MicrophoneIcon, SparkleIcon, CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { useState, useEffect } from "react";

const LOADING_MESSAGES = {
    [TRANSCRIPTION_STATUS.HOLD]: {
        title: "Connecting to server",
        subtitle: "Establishing connection with our AI transcription service",
        icon: CircleNotchIcon,
        progress: 10
    },
    [TRANSCRIPTION_STATUS.INIT]: {
        title: "Initializing transcription",
        subtitle: "Setting up your audio file for processing",
        icon: CircleNotchIcon,
        progress: 20
    },
    [TRANSCRIPTION_STATUS.FETCHING_AUDIO]: {
        title: "Processing audio file",
        subtitle: "Analyzing audio format and preparing for transcription",
        icon: WaveformIcon,
        progress: 35
    },
    [TRANSCRIPTION_STATUS.TRANSCRIBING]: {
        title: "AI transcribing audio",
        subtitle: "Converting speech to text with speaker identification",
        icon: MicrophoneIcon,
        progress: 70
    },
    [TRANSCRIPTION_STATUS.SUMMARIZING]: {
        title: "Creating intelligent summary",
        subtitle: "Analyzing content and generating key insights",
        icon: SparkleIcon,
        progress: 90
    },
    [TRANSCRIPTION_STATUS.COMPLETED]: {
        title: "Ready!",
        subtitle: "Your transcript and summary are complete",
        icon: CheckCircleIcon,
        progress: 100
    },
};

export default function LoadingUI(props: { state: TRANSCRIPTION_STATUS }) {
    const messageData = LOADING_MESSAGES[props?.state];

    const showShareLink = props?.state !== TRANSCRIPTION_STATUS.COMPLETED && 
                         props?.state !== TRANSCRIPTION_STATUS.HOLD;

    const isProcessing = props?.state === TRANSCRIPTION_STATUS.TRANSCRIBING || 
                        props?.state === TRANSCRIPTION_STATUS.SUMMARIZING;

    const isCompleted = props?.state === TRANSCRIPTION_STATUS.COMPLETED;

    const StatusIcon = messageData?.icon || CircleNotchIcon;
    
    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
            <div className="max-w-3xl mx-auto text-center space-y-12">
                
                {/* Main Status Card */}
                <div className="relative">
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-3xl blur-3xl" />
                    
                    <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 lg:p-12 shadow-lg ring-1 ring-primary/5">
                        {/* Progress Bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-muted/30 rounded-t-2xl overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-1000 ease-out"
                                style={{ width: `${messageData?.progress || 0}%` }}
                            />
                        </div>
                        
                        {/* Status Content */}
                        <div className="space-y-6">
                            {/* Icon and Status */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg" />
                                    <div className="relative bg-primary/10 border border-primary/20 rounded-full p-4">
                                        <StatusIcon 
                                            className={`w-8 h-8 text-primary ${
                                                isCompleted ? '' : 'animate-spin'
                                            }`} 
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                                        {messageData?.title || "Processing"}
                                    </h1>
                                    {messageData?.subtitle && (
                                        <p className="text-base text-muted-foreground max-w-lg mx-auto">
                                            {messageData.subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            {/* Progress Percentage */}
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                <span>{messageData?.progress || 0}% complete</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Share Link Section */}
                {showShareLink && (
                    <div className="space-y-6">
                        <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm">
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-foreground flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                    {isProcessing ? "Processing in Progress" : "Queued for Processing"}
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                                    {isProcessing
                                        ? "Keep this page open or bookmark this link to check back later. Processing typically takes 2-5 minutes."
                                        : "Your request is in our processing queue. Save this link to check your results anytime."}
                                </p>
                            </div>
                            
                            <div className="mt-4">
                                <ClipboardCopy
                                    variant="outline"
                                    size="sm"
                                    showToast={true}
                                    className="hover:scale-105 transition-all duration-200 hover:border-primary/50"
                                >
                                    Copy shareable link
                                </ClipboardCopy>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
