export type SpeakerSegment = { 
    speakerId: string; 
    displayName: string; 
    text: string; 
};

// Convert SPEAKER_00 to Speaker 1, SPEAKER_01 to Speaker 2, etc.
export function getDisplaySpeakerName(speakerId: string, mappings: Record<string, string>): string {
    if (mappings && mappings[speakerId]) {
        return mappings[speakerId];
    }
    
    const match = speakerId.match(/SPEAKER_(\d+)/);
    if (match) {
        const num = parseInt(match[1]) + 1;
        return `Speaker ${num}`;
    }
    
    return speakerId;
}

// Parse speaker transcript into segments with tag processing
export function parseSpeakerTranscript(transcript: string, mappings: Record<string, string>): SpeakerSegment[] {
    if (!transcript) return [];
    
    const lines = transcript.split(/\n+/).filter(Boolean);
    const segments: SpeakerSegment[] = [];
    
    for (let line of lines) {
        // Apply speaker mappings to the line
        let mappedLine = line;
        Object.entries(mappings).forEach(([originalId, customName]) => {
            mappedLine = mappedLine.replace(new RegExp(`\\b${originalId}:`, 'g'), `${customName}:`);
        });
        
        // Parse speaker segment
        const match = mappedLine.match(/^([^:]+?):\s*(.*)$/);
        if (match) {
            const speakerLabel = match[1]?.trim() || '';
            const text = match[2]?.trim() || '';
            segments.push({
                speakerId: speakerLabel,
                displayName: getDisplaySpeakerName(speakerLabel, mappings),
                text,
            });
        } else if (line.trim()) {
            segments.push({
                speakerId: '',
                displayName: '',
                text: line.trim(),
            });
        }
    }
    return segments;
}

// Elegant speaker color palette
export const speakerColors = [
    'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-700',
    'bg-green-50 text-green-900 border-green-200 dark:bg-green-900/30 dark:text-green-100 dark:border-green-700',
    'bg-purple-50 text-purple-900 border-purple-200 dark:bg-purple-900/30 dark:text-purple-100 dark:border-purple-700',
    'bg-gray-50 text-gray-900 border-gray-200 dark:bg-gray-900/30 dark:text-gray-100 dark:border-gray-700',
    'bg-pink-50 text-pink-900 border-pink-200 dark:bg-pink-900/30 dark:text-pink-100 dark:border-pink-700',
    'bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-100 dark:border-yellow-700',
    'bg-teal-50 text-teal-900 border-teal-200 dark:bg-teal-900/30 dark:text-teal-100 dark:border-teal-700',
    'bg-orange-50 text-orange-900 border-orange-200 dark:bg-orange-900/30 dark:text-orange-100 dark:border-orange-700',
];

export function getSpeakerColor(speakerId: string) {
    if (speakerId === 'UNKNOWN') {
        return 'bg-muted text-muted-foreground border-border';
    }
    const colorIndex = Math.abs(speakerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
    return speakerColors[colorIndex % speakerColors.length];
} 