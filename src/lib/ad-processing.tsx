import React from 'react';

/**
 * Process text and handle [AD] tags, returning both content and ad information
 * @param text - The text to process
 * @returns Object with processed content and ad segment info
 */
export function processTextWithAds(text: string): {
    content: React.ReactNode[];
    hasAds: boolean;
    adSegments: number[];
} {
    // If no ads, return as-is
    if (!text.includes('[AD]')) {
        return {
            content: [<span key="regular">{text}</span>],
            hasAds: false,
            adSegments: []
        };
    }

    // Handle both standalone [AD] and [AD] with content
    const segments: React.ReactNode[] = [];
    const adSegments: number[] = [];
    
    // Split by [AD] markers, keeping the markers
    const parts = text.split(/(\[AD\](?:[^\[]*)?)/);
    
    parts.forEach((part, index) => {
        if (part.includes('[AD]')) {
            // This is an ad segment
            adSegments.push(segments.length);
            
            // Extract content after [AD] marker
            const adContent = part.replace(/^\[AD\]\s*/, '').trim();
            
            if (adContent) {
                // [AD] with content - show the content subtly
                segments.push(
                    <span key={`ad-${index}`} className="italic text-muted-foreground">
                        {adContent}
                    </span>
                );
            } else {
                // Standalone [AD] - show generic sponsored content message
                segments.push(
                    <span key={`ad-${index}`} className="italic text-muted-foreground">
                        [Sponsored content]
                    </span>
                );
            }
        } else if (part.trim()) {
            // Regular content
            segments.push(
                <span key={`regular-${index}`}>{part}</span>
            );
        }
    });

    return {
        content: segments.length > 0 ? segments : [<span key="regular">{text}</span>],
        hasAds: true,
        adSegments
    };
}
