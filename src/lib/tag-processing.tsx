import React from 'react';

// Define supported tags and their UI metadata
export const TAGS = {
    AD: { label: 'Ad', color: '#f59e42' },
};

export type SupportedTag = keyof typeof TAGS;

/**
 * Process text and handle properly paired [TAG]... [TAG] blocks (single-line or multi-line)
 * @param text - The text to process
 * @returns Object with processed content and tag segment info
 */
export function processTextWithTags(text: string): {
    content: React.ReactNode[];
    tagSegments: { tag: SupportedTag; index: number }[];
    hasTags: boolean;
} {
    // Early return if no tags
    if (!text.match(/\[(AD|QUOTE|FACT|JOKE|ACTION|CHAPTER)\]/)) {
        return {
            content: [<span key="regular">{text}</span>],
            tagSegments: [],
            hasTags: false,
        };
    }

    const segments: React.ReactNode[] = [];
    const tagSegments: { tag: SupportedTag; index: number }[] = [];
    let inTag: SupportedTag | null = null;
    let tagBuffer: string[] = [];
    let lines = text.split(/\n+/);

    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        // Check for single-line [TAG]... [TAG]
        const singleTagMatch = trimmed.match(/^\[(AD|QUOTE|FACT|JOKE|ACTION|CHAPTER)\](.*)\[(AD|QUOTE|FACT|JOKE|ACTION|CHAPTER)\]$/);
        if (singleTagMatch && singleTagMatch[1] === singleTagMatch[3]) {
            const tag = singleTagMatch[1] as SupportedTag;
            const tagContent = singleTagMatch[2].trim();
            tagSegments.push({ tag, index: segments.length });
            segments.push(
                <span key={`${tag.toLowerCase()}-${idx}`} data-tag={tag}>
                    {tagContent}
                </span>
            );
        } else {
            // Check for start of multi-line tag block
            const startMatch = trimmed.match(/^\[(AD|QUOTE|FACT|JOKE|ACTION|CHAPTER)\](.*)$/);
            if (startMatch && !inTag) {
                inTag = startMatch[1] as SupportedTag;
                tagBuffer = [startMatch[2].trim()];
            } else if (trimmed.match(/^\[(AD|QUOTE|FACT|JOKE|ACTION|CHAPTER)\]$/) && inTag) {
                // End of multi-line tag block
                const tag = inTag;
                tagSegments.push({ tag, index: segments.length });
                segments.push(
                    <span key={`${tag.toLowerCase()}-${idx}`} data-tag={tag}>
                        {tagBuffer.join(' ').trim()}
                    </span>
                );
                inTag = null;
                tagBuffer = [];
            } else if (inTag) {
                tagBuffer.push(trimmed);
            } else if (trimmed) {
                segments.push(
                    <span key={`regular-${idx}`}>{line}</span>
                );
            }
        }
    });

    // If tag block was not properly closed, treat as regular content
    if (inTag && tagBuffer.length > 0) {
        segments.push(
            <span key={`regular-unclosed`}>{tagBuffer.join(' ')}</span>
        );
    }

    return {
        content: segments.length > 0 ? segments : [<span key="regular">{text}</span>],
        tagSegments,
        hasTags: tagSegments.length > 0,
    };
}
