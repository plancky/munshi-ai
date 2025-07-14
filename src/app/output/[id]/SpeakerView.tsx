import React from "react";
import { SpeakerParagraph } from './SpeakerParagraph';
import { SpeakerSegment } from './speakerUtils';

interface SpeakerViewProps {
    speakerSegments: SpeakerSegment[];
    onEditSpeaker: (speakerId: string, newName: string) => void;
}

export function SpeakerView({ speakerSegments, onEditSpeaker }: SpeakerViewProps) {
    return (
        <div className="space-y-4">
            {speakerSegments.map((segment, index) => (
                <SpeakerParagraph
                    key={`${segment.speakerId}-${index}`}
                    segment={segment}
                    onEditSpeaker={onEditSpeaker}
                />
            ))}
        </div>
    );
} 