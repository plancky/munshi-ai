"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { updateSpeakerMappings } from "./utils";
import ClipboardCopy from "@/components/ClipboardCopy";
import { ModedOutputDataObject } from "../../api/get/types";
import { MetadataObject } from "@/shared/types";
import { SparkleIcon, ArrowDownIcon, UsersIcon, FileTextIcon } from "@phosphor-icons/react/dist/ssr";
import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { processTextIntoParagraphs } from '@/lib/transcript-processing';
import { SpeakerSegment, parseSpeakerTranscript } from './speakerUtils';
import { SpeakerView } from './SpeakerView';
import { RegularView } from './RegularView';



interface TranscriptCardProps {
    data: ModedOutputDataObject;
    metadata: MetadataObject;
    id: string;
}



export default function TranscriptCard({
    data,
    metadata,
    id: idProp,
}: TranscriptCardProps) {
    const { text, summary_gemini, speaker_transcript, speaker_mappings } = data;
    const { title: audioTitle, author } = metadata;
    const queryClient = useQueryClient();
    
    const [viewMode, setViewMode] = useState<"regular" | "speakers">(
        speaker_transcript ? "speakers" : "regular"
    );
    
    const [localSpeakerMappings, setLocalSpeakerMappings] = useState<Record<string, string>>({});
    const [isSavingSpeakers, setIsSavingSpeakers] = useState(false);
    const [lastSaveError, setLastSaveError] = useState<string | null>(null);
    
    // Sync local state with backend data
    useEffect(() => {
        setLocalSpeakerMappings(speaker_mappings || {});
    }, [speaker_mappings]);
    
    const handleSpeakerEdit = async (speakerId: string, newName: string) => {
        const originalMappings = { ...localSpeakerMappings };
        
        // Optimistically update local state
        const updatedMappings = { ...localSpeakerMappings, [speakerId]: newName };
        setLocalSpeakerMappings(updatedMappings);
        setLastSaveError(null);
        
        // Save to backend
        setIsSavingSpeakers(true);
        try {
            const response = await updateSpeakerMappings(idProp, updatedMappings);
            
            if (response.status !== "success") {
                throw new Error(response.message || "Failed to update speaker mapping");
            }
            
            await queryClient.invalidateQueries({ 
                queryKey: ["output_data", idProp] 
            });
            
        } catch (error) {
            console.error("Failed to save speaker mapping:", error);
            setLastSaveError(error instanceof Error ? error.message : "Failed to save");
            setLocalSpeakerMappings(originalMappings);
        } finally {
            setIsSavingSpeakers(false);
        }
    };
    
    // Parse speaker segments with tag processing
    const speakerSegments: SpeakerSegment[] = useMemo(() => 
        parseSpeakerTranscript(speaker_transcript || '', localSpeakerMappings), 
        [speaker_transcript, localSpeakerMappings]
    );

    // Process regular text into paragraphs with tag handling
    const { paragraphs } = useMemo(() => {
        return processTextIntoParagraphs(text || "");
    }, [text]);

    return (
        <div className="content-grid py-32">
            <div className="full-width-gridless flex gap-8 max-w-5xl mx-auto">
                {/* Main content area */}
                <div className="flex flex-col gap-5 flex-1">
                {/* Audio Metadata Header */}
                {(audioTitle || author) && (
                    <div className="flex flex-col gap-2 mb-2">
                        {audioTitle && (
                            <div className="flex items-center gap-2">
                                <h1 className="font-heading text-base lg:text-lg font-semibold text-foreground">
                                    {Array.isArray(audioTitle) ? audioTitle.join(' ') : audioTitle}
                                </h1>
                            </div>
                        )}
                        {author && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="text-sm font-medium">{Array.isArray(author) ? author.join(' ') : author}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Summary Card */}
                {summary_gemini && (
                    <>
                        <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg ring-1 ring-primary/5">
                            <CardHeader className="pb-3 pt-4 px-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 font-heading text-base">
                                        <SparkleIcon className="w-4 h-4 text-primary" />
                                        TL;DR
                                    </CardTitle>
                                    <ClipboardCopy
                                        textToCopy={summary_gemini.replace(/<[^>]*>/g, '')}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Copy
                                    </ClipboardCopy>
                                </div>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: summary_gemini,
                                    }}
                                    className="prose prose-gray dark:prose-invert prose-sm max-w-none [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&>p]:text-sm [&>ul]:text-sm [&>li]:text-sm"
                                />
                            </CardContent>
                        </Card>
                        
                        {/* Scroll indicator */}
                        <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
                            <ArrowDownIcon className="w-3 h-3" />
                            <span>Full transcript below</span>
                            <ArrowDownIcon className="w-3 h-3" />
                        </div>
                    </>
                )}

                {/* Transcript Card */}
                <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg ring-1 ring-primary/5">
                        <CardHeader className="pb-3 pt-4 px-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CardTitle className="font-heading text-base">Full Transcript</CardTitle>
                                    {speaker_transcript && (
                                        <ToggleGroup 
                                            value={viewMode} 
                                            onValueChange={(value) => value && setViewMode(value as "regular" | "speakers")}
                                            type="single"
                                            size="sm"
                                        >
                                            <ToggleGroupItem value="regular" className="gap-1.5 text-xs">
                                                <FileTextIcon size={12} />
                                                Regular
                                            </ToggleGroupItem>
                                            <ToggleGroupItem value="speakers" className="gap-1.5 text-xs">
                                                <UsersIcon size={12} />
                                                Speakers
                                            </ToggleGroupItem>
                                        </ToggleGroup>
                                    )}
                                    <div className="flex items-center gap-2">
                                        {isSavingSpeakers && (
                                            <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                Saving...
                                            </span>
                                        )}
                                        {lastSaveError && (
                                            <span className="text-xs text-red-600 dark:text-red-400">
                                                Error: {lastSaveError}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ClipboardCopy 
                                        textToCopy={text || ""}
                                        variant="outline" 
                                        size="sm"
                                    >
                                        Copy
                                    </ClipboardCopy>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="rounded-lg border shadow-sm p-4 min-h-[120px]">
                                {/* Render different content based on view mode */}
                                {viewMode === "speakers" && speaker_transcript ? (
                                    <SpeakerView 
                                        speakerSegments={speakerSegments}
                                        onEditSpeaker={handleSpeakerEdit}
                                    />
                                ) : (
                                    <RegularView paragraphs={paragraphs} />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
