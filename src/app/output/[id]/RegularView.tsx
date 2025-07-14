import React from "react";

interface RegularViewProps {
    paragraphs: React.ReactNode[][];
}

export function RegularView({ paragraphs }: RegularViewProps) {
    return (
        <div className="text-sm leading-relaxed text-foreground">
            {paragraphs.map((paragraph, index) => (
                <div key={index} className="mb-4 last:mb-0">
                    {paragraph}
                </div>
            ))}
        </div>
    );
} 