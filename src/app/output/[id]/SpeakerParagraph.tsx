"use client";
import React, { useState, useEffect } from "react";
import { PencilIcon } from "@phosphor-icons/react/dist/ssr";
import { processTextWithTags } from '@/lib/transcript-processing';
import { TagIndicator } from '@/components/TagIndicator';
import { SpeakerSegment, getSpeakerColor } from './speakerUtils';

interface SpeakerParagraphProps {
    segment: SpeakerSegment;
    onEditSpeaker?: (speakerId: string, newName: string) => void;
}

export function SpeakerParagraph({ segment, onEditSpeaker }: SpeakerParagraphProps) {
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

    // Process text with tags for speaker content and check for tag indicators
    const { content: processedContent } = processTextWithTags(segment.text);
    
    // Check if this segment contains tags that need indicators
    const hasTagBlocks = /\[(AD|TAG)\].*?\[\/\1\]/.test(segment.text);

    const isUnknown = !segment.displayName || segment.displayName.trim().toLowerCase() === 'unknown';
    return (
        <div className={`group ${hasTagBlocks ? 'relative' : ''}`}>
            {/* Tag indicator for speaker segments */}
            {hasTagBlocks && (
                <div className="hidden lg:block absolute left-[-80px] top-8 pointer-events-none">
                    <TagIndicator text={segment.text.match(/\[(AD|TAG)\]/)?.[1] || 'AD'} />
                </div>
            )}
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
                {processedContent}
            </div>
        </div>
    );
} 