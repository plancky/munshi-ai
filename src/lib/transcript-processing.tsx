import React from 'react';
import { TagIndicator } from '@/components/TagIndicator';

// Define supported tags and their UI metadata
export const TAGS = {
    AD: { 
        label: '💰 Ad',
    },
    TAG: {
        label: '🏷️ Tag',
    },
};

export type SupportedTag = keyof typeof TAGS;

// Create tag pattern from TAGS keys
const TAG_PATTERN = Object.keys(TAGS).join('|');

/**
 * Process text and handle [TAG]content[TAG] blocks (UI layer)
 * @param text - The text to process
 * @returns Object with processed content
 */
export function processTextWithTags(text: string): {
    content: React.ReactNode[];
} {
    const tagRegex = new RegExp(`\\[(${TAG_PATTERN})\\](.*?)\\[\\/\\1\\]`, 'gs');
    const matches = Array.from(text.matchAll(tagRegex));
    
    if (matches.length === 0) {
        return {
            content: [<span key="text">{text}</span>],
        };
    }

    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match, idx) => {
        const [fullMatch, tag, content] = match;
        const matchStart = match.index!;
        
        // Add text before this tag
        if (matchStart > lastIndex) {
            const beforeText = text.slice(lastIndex, matchStart);
            if (beforeText.trim()) {
                segments.push(<span key={`before-${idx}`}>{beforeText}</span>);
            }
        }
        
        const tagConfig = TAGS[tag as SupportedTag];
        segments.push(
            <span 
                key={`${tag.toLowerCase()}-${idx}`}
                data-tag={tag}
                data-tag-type={tag}
                className={`rounded px-1 py-0.5 text-sm font-medium bg-orange-100 text-orange-800 hover:bg-orange-200`}
                title={tagConfig.label}
            >
                {content.trim()}
            </span>
        );
        
        lastIndex = matchStart + fullMatch.length;
    });

    // Add remaining text
    if (lastIndex < text.length) {
        const remainingText = text.slice(lastIndex);
        if (remainingText.trim()) {
            segments.push(<span key="after">{remainingText}</span>);
        }
    }

    return {
        content: segments,
    };
}

/**
 * Split text into paragraphs using the logical structure from Gemini cleaning
 * @param text - The text to process (already cleaned and paragraphed by Gemini)
 * @returns Object with processed paragraphs
 */
export function processTextIntoParagraphs(text: string): {
    paragraphs: React.ReactNode[][];
} {
    // Split by double newlines (logical paragraphs from Gemini cleaning)
    const rawParagraphs = text.split('\n\n').filter(p => p.trim());
    
    const paragraphs: React.ReactNode[][] = [];
    
    rawParagraphs.forEach(paragraphText => {
        // Check if this paragraph contains tags
        const hasTagBlocks = /\[(AD|TAG)\].*?\[\/\1\]/.test(paragraphText);
        
        if (hasTagBlocks) {
            // Extract the tag type for the indicator
            const tagMatch = paragraphText.match(/\[(AD|TAG)\]/);
            const tagType = tagMatch?.[1] as SupportedTag || 'AD';
            
            // Process the paragraph content with tag highlighting
            const { content } = processTextWithTags(paragraphText);
            
            // Tagged paragraph with indicator positioned relative to paragraph
            const wrappedContent = [
                <div key="tagged-paragraph" className="relative" data-tag={tagType}>
                    {/* Tag indicator positioned relative to this paragraph */}
                    <div className="hidden lg:block absolute left-[-80px] top-0 pointer-events-none">
                        <TagIndicator text={tagType} />
                    </div>
                    <div>
                        {content}
                    </div>
                </div>
            ];
            
            paragraphs.push(wrappedContent);
        } else {
            // Regular paragraph - just process for any inline tags
            const { content } = processTextWithTags(paragraphText);
            paragraphs.push(content);
        }
    });

    return {
        paragraphs,
    };
}
