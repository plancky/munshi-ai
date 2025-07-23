"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import { UsersIcon, ClockIcon } from "@phosphor-icons/react/dist/ssr";
import { useFormState } from "./FormStateProvider";
import { FormStateActionTypes } from "./FormStateReducer";

export function SpeakerSettings() {
    const { formState, dispatch } = useFormState();
    const { enableSpeakers, numSpeakers } = formState;

    const handleSpeakerToggle = (enabled: boolean) => {
        dispatch!({
            type: FormStateActionTypes.SET_SPEAKER_SETTINGS,
            payload: {
                enableSpeakers: enabled,
                numSpeakers: numSpeakers,
            },
        });
    };

    const handleSpeakerCountChange = (count: string) => {
        dispatch!({
            type: FormStateActionTypes.SET_SPEAKER_SETTINGS,
            payload: {
                enableSpeakers: enableSpeakers,
                numSpeakers: parseInt(count),
            },
        });
    };

    return (
        <Card className="w-full bg-card border border-border shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <UsersIcon className="w-4 h-4 text-primary" />
                        Speaker Detection
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Label htmlFor="speaker-toggle" className="text-sm font-medium">
                                Enable Speaker Diarization
                            </Label>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Identify who spoke when in your transcript
                            </p>
                        </div>
                        <Toggle
                            id="speaker-toggle"
                            pressed={enableSpeakers}
                            onPressedChange={handleSpeakerToggle}
                            aria-label="Enable speaker diarization"
                        >
                            <UsersIcon className="w-4 h-4" />
                        </Toggle>
                    </div>

                    {enableSpeakers && (
                        <>
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">
                                            Expected Number of Speakers
                                        </Label>
                                        <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full min-w-[2.5rem] text-center">
                                            {numSpeakers}
                                        </div>
                                    </div>
                                    
                                    {/* Apple-style segmented slider */}
                                    <div className="relative py-2">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                                                <button
                                                    key={count}
                                                    onClick={() => handleSpeakerCountChange(count.toString())}
                                                    className={`flex-1 h-2 rounded-full transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
                                                        count <= numSpeakers 
                                                            ? 'bg-primary shadow-sm' 
                                                            : 'bg-muted hover:bg-muted-foreground/20'
                                                    }`}
                                                    aria-label={`Set ${count} speakers`}
                                                />
                                            ))}
                                        </div>
                                        
                                        {/* Value labels */}
                                        <div className="flex justify-between mt-2 px-1">
                                            <span className="text-xs text-muted-foreground">1</span>
                                            <span className="text-xs text-muted-foreground">10</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <ClockIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                                    <p className="font-medium">Fair warning</p>
                                    <p className="leading-relaxed">Speaker detection adds 8-10 minutes but makes conversations way easier to follow.</p>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
    );
} 