"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { getSummary, updateSpeakerMappings } from "./utils";
import ClipboardCopy from "@/components/ClipboardCopy";
import { ModedOutputDataObject } from "../../api/get/types";
import { MetadataObject } from "@/shared/types";
import { SparkleIcon, ArrowDownIcon, UsersIcon, FileTextIcon, PencilIcon } from "@phosphor-icons/react/dist/ssr";
import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { processTextWithAds } from "@/lib/ad-processing";

interface TranscriptCardProps {
    data: ModedOutputDataObject;
    metadata: MetadataObject;
    id: string;
}

type ParsedSegment = { isAd: boolean, speakerId: string, displayName: string, text: string };

// Utility functions for speaker handling
function applySpeakerMappings(text: string, mappings: Record<string, string>): string {
    if (!mappings || Object.keys(mappings).length === 0) return text;

    let result = text;
    Object.entries(mappings).forEach(([originalId, customName]) => {

        const patterns = [
            new RegExp(`\\b${originalId}:`, 'g'),
        ];
        
        patterns.forEach(pattern => {
            result = result.replace(pattern, `${customName}:`);
        });
    });
    
    return result;
}

function getDisplaySpeakerName(speakerId: string, mappings: Record<string, string>): string {
    // Return custom mapping if exists
    if (mappings && mappings[speakerId]) {
        return mappings[speakerId];
    }
    
    // Convert SPEAKER_00 to Speaker 1, SPEAKER_01 to Speaker 2, etc.
    const match = speakerId.match(/SPEAKER_(\d+)/);
    if (match) {
        const num = parseInt(match[1]) + 1;
        return `Speaker ${num}`;
    }
    
    return speakerId;
}

// Helper: Parse the full transcript into segments
function parseTranscript(transcript: string, mappings: Record<string, string>): ParsedSegment[] {
    if (!transcript) return [];
    const lines = transcript.split(/\n+/).filter(Boolean);
    const segments: ParsedSegment[] = [];
    for (let line of lines) {
        // Detect ad segment: [AD] ... [AD]
        const isAd = line.trim().startsWith('[AD]') && line.trim().endsWith('[AD]');
        if (isAd) {
            const cleaned = line.trim().replace(/^\[AD\]\s*/, '').replace(/\s*\[AD\]$/, '').trim();
            const match = cleaned.match(/^([^:]+?):\s*(.*)$/);
            if (match) {
                const speakerLabel = match[1]?.trim() || '';
                const text = match[2]?.trim() || '';
                segments.push({
                    isAd: true,
                    speakerId: speakerLabel,
                    displayName: getDisplaySpeakerName(speakerLabel, mappings),
                    text,
                });
            } else {
                segments.push({
                    isAd: true,
                    speakerId: '',
                    displayName: '',
                    text: cleaned,
                });
            }
            continue;
        }
        // Regular speaker segment
        const mapped = applySpeakerMappings(line, mappings);
        const match = mapped.match(/^([^:]+?):\s*(.*)$/);
        if (match) {
            const speakerLabel = match[1]?.trim() || '';
            const text = match[2]?.trim() || '';
            segments.push({
                isAd: false,
                speakerId: speakerLabel,
                displayName: getDisplaySpeakerName(speakerLabel, mappings),
                text,
            });
        }
    }
    return segments;
}

// Subtle, elegant speaker color palette
const speakerColors = [
    'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-700',
    'bg-green-50 text-green-900 border-green-200 dark:bg-green-900/30 dark:text-green-100 dark:border-green-700',
    'bg-purple-50 text-purple-900 border-purple-200 dark:bg-purple-900/30 dark:text-purple-100 dark:border-purple-700',
    'bg-gray-50 text-gray-900 border-gray-200 dark:bg-gray-900/30 dark:text-gray-100 dark:border-gray-700',
    'bg-pink-50 text-pink-900 border-pink-200 dark:bg-pink-900/30 dark:text-pink-100 dark:border-pink-700',
    'bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-100 dark:border-yellow-700',
    'bg-teal-50 text-teal-900 border-teal-200 dark:bg-teal-900/30 dark:text-teal-100 dark:border-teal-700',
    'bg-orange-50 text-orange-900 border-orange-200 dark:bg-orange-900/30 dark:text-orange-100 dark:border-orange-700',
];

function getSpeakerColor(speakerId: string) {
    if (speakerId === 'UNKNOWN') {
        return 'bg-muted text-muted-foreground border-border';
    }
    const colorIndex = Math.abs(speakerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
    return speakerColors[colorIndex % speakerColors.length];
}

function SpeakerParagraph({ segment, onEditSpeaker }: { segment: ParsedSegment; onEditSpeaker?: (speakerId: string, newName: string) => void; }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(segment.displayName);

    useEffect(() => {
        setEditValue(segment.displayName);
    }, [segment.displayName]);

    const startEdit = () => {
        setEditValue(segment.displayName);
        setIsEditing(true);
    };
    const saveEdit = () => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== segment.displayName && onEditSpeaker) {
            onEditSpeaker(segment.speakerId, trimmed);
        }
        setIsEditing(false);
    };
    const cancelEdit = () => setIsEditing(false);

    // Ad segment rendering
    if (segment.isAd) {
        return (
            <div className="group relative">
                <div className="absolute -left-10 top-1/2 -translate-y-1/2">
                    <span className="px-2 py-0.5 rounded-full bg-muted text-foreground border border-border text-xs font-semibold shadow">Ad</span>
                </div>
                {segment.displayName && (
                    <div className="mb-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border-2 border-dashed border-accent bg-accent/10 text-accent-foreground">
                            {segment.displayName}
                        </span>
                    </div>
                )}
                <div className="italic text-muted-foreground text-sm leading-relaxed pl-1">
                    {segment.text}
                </div>
            </div>
        );
    }
    // Regular speaker rendering
    const isUnknown = !segment.displayName || segment.displayName.trim().toLowerCase() === 'unknown';
    return (
        <div className="group">
            <div className="mb-2">
                {isEditing ? (
                    <input
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={e => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                        }}
                        autoFocus
                        className="w-32 h-7 text-xs font-medium"
                    />
                ) : (
                    <button
                        onClick={() => !isUnknown && startEdit()}
                        className={`
                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border backdrop-blur-sm
                            transition-all duration-200 min-w-[100px] justify-center
                            ${isUnknown ? 'bg-muted text-muted-foreground border-border' : getSpeakerColor(segment.speakerId)}
                            ${!isUnknown && onEditSpeaker && segment.speakerId !== 'UNKNOWN' ? 'hover:scale-105 hover:shadow-md cursor-pointer' : 'cursor-default'}
                        `}
                        disabled={isUnknown || !onEditSpeaker || segment.speakerId === 'UNKNOWN'}
                        title={!isUnknown && onEditSpeaker && segment.speakerId !== 'UNKNOWN' ? "Click to edit speaker name" : ""}
                    >
                        {segment.displayName}
                        {!isUnknown && onEditSpeaker && segment.speakerId !== 'UNKNOWN' && (
                            <PencilIcon 
                                size={10} 
                                className="opacity-0 group-hover:opacity-60 transition-opacity" 
                            />
                        )}
                    </button>
                )}
            </div>
            <div className="text-sm leading-relaxed text-foreground pl-1">
                {processTextWithAds(segment.text).content}
            </div>
        </div>
    );
}

export default function TranscriptCard({
    data,
    metadata,
    id: idProp,
}: TranscriptCardProps) {
    const { text, summary_gemini, paras, speaker_transcript, speaker_paras, speaker_mappings } = data;
    const { title: audioTitle, author } = metadata;
    const queryClient = useQueryClient();
    
    const [viewMode, setViewMode] = useState<"regular" | "speakers">(
        speaker_transcript ? "speakers" : "regular"
    );
    
    // Simplified state management - use backend as source of truth
    const [localSpeakerMappings, setLocalSpeakerMappings] = useState<Record<string, string>>({});
    const [isSavingSpeakers, setIsSavingSpeakers] = useState(false);
    const [lastSaveError, setLastSaveError] = useState<string | null>(null);
    
    // Sync local state with backend data only when it changes
    useEffect(() => {
        setLocalSpeakerMappings(speaker_mappings || {});
    }, [speaker_mappings]);
    
    // Simplified content selection - use the appropriate data directly
    const displayContent = useMemo(() => {
        if (viewMode === "speakers" && speaker_paras) {
            return {
                text: speaker_transcript || text,
                paras: speaker_paras
            };
        }
        return {
            text: text,
            paras: paras
        };
    }, [viewMode, speaker_transcript, speaker_paras, text, paras]);
    
    const handleSpeakerEdit = async (speakerId: string, newName: string) => {
        // Store original state for revert
        const originalMappings = { ...localSpeakerMappings };
        
        // Optimistically update local state first for immediate UI feedback
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
            
            // Invalidate and refetch the transcript data to get updated speaker mappings
            await queryClient.invalidateQueries({ 
                queryKey: ["output_data", idProp] 
            });
            
        } catch (error) {
            console.error("Failed to save speaker mapping:", error);
            setLastSaveError(error instanceof Error ? error.message : "Failed to save");
            
            // Fixed revert logic - restore to original state
            setLocalSpeakerMappings(originalMappings);
            
        } finally {
            setIsSavingSpeakers(false);
        }
    };
    
    const parsedSegments: ParsedSegment[] = useMemo(() => parseTranscript(speaker_transcript || '', localSpeakerMappings), [speaker_transcript, localSpeakerMappings]);
    
    return (
        <div className="content-grid py-8">
            <div className="full-width-gridless flex gap-8 max-w-5xl mx-auto">
                {/* Left margin for sponsored content indicators */}
                <div className="w-8 flex-shrink-0 relative">
                    {/* Indicators will be positioned here */}
                </div>
                
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
                                {!summary_gemini && (
                                    <Button
                                        onClick={async () => await getSummary(idProp)}
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 text-xs"
                                    >
                                        <SparkleIcon size={14} />
                                        Get TL;DR
                                    </Button>
                                )}
                                <ClipboardCopy 
                                    textToCopy={displayContent.text}
                                    variant="outline" 
                                    size="sm"
                                >
                                    Copy
                                </ClipboardCopy>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="prose prose-gray dark:prose-invert prose-sm max-w-none">
                            {viewMode === "speakers" ? (
                                <div className="space-y-4">
                                    {parsedSegments.map((segment, _i) => (
                                        <SpeakerParagraph 
                                            key={_i}
                                            segment={segment}
                                            onEditSpeaker={handleSpeakerEdit}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {displayContent.paras?.map((para, _i) => {
                                        const processed = processTextWithAds(para);
                                        return (
                                            <div key={`para_${_i}`} className="text-sm leading-relaxed text-foreground relative">
                                                {processed.content}
                                                {/* Add sponsored indicators to left margin */}
                                                {processed.hasAds && (
                                                    <div className="absolute -left-10 top-1/2 -translate-y-1/2">
                                                        <span className="px-2 py-0.5 rounded-full bg-muted text-foreground border border-border text-xs font-semibold shadow">Ad</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                </div>
            </div>
        </div>
    );
}
