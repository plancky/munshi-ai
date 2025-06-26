"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                    <UsersIcon className="w-4 h-4 text-primary" />
                    Speaker Detection
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label htmlFor="speaker-toggle" className="text-sm font-medium">
                            Enable Speaker Diarization
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Identify who spoke when in your transcript
                        </p>
                    </div>
                    <Toggle
                        id="speaker-toggle"
                        pressed={enableSpeakers}
                        onPressedChange={handleSpeakerToggle}
                        aria-label="Enable speaker diarization"
                        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                        <UsersIcon className="w-4 h-4" />
                    </Toggle>
                </div>

                {enableSpeakers && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="speaker-count" className="text-sm font-medium">
                                Expected Number of Speakers
                            </Label>
                            <Select value={numSpeakers.toString()} onValueChange={handleSpeakerCountChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select number of speakers" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                                        <SelectItem key={count} value={count.toString()}>
                                            {count} {count === 1 ? 'speaker' : 'speakers'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <ClockIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-yellow-700 dark:text-yellow-300">
                                <p className="font-medium">Processing Time Notice</p>
                                <p>Speaker detection adds 8-10 minutes to processing time but provides better conversation flow.</p>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
} 