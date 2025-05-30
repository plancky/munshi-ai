"use client";
import React, { ReactElement, useCallback, useState } from "react";
import { Button } from "@/components/ui/button"; // shadcn/ui button
import { Check, Copy } from "lucide-react";

interface ClipboardCopyProps {
    textToCopy?: string;
    className?: string;
    Icon?: ReactElement;
}

const ClipboardCopy: React.FC<ClipboardCopyProps> = ({
    textToCopy,
    className = "",
    Icon,
}) => {
    const [copied, setCopied] = useState<boolean>(false);

    const handleCopy = useCallback(async (): Promise<void> => {
        try {
            if (textToCopy) await navigator.clipboard.writeText(textToCopy);
            else await navigator.clipboard.writeText(window.location.href)
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text:", err);
        }
    }, [textToCopy]);

    return (
        <div
            className={`flex items-center space-x-2 rounded-xl shadow ${className}`}
        >
            <Button
                onClick={handleCopy}
                variant="outline"
                size="icon"
                aria-label="Copy to clipboard"
            >
                {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                ) : Icon ? (
                    Icon
                ) : (
                    <Copy className="h-4 w-4" />
                )}
            </Button>
        </div>
    );
};

export default ClipboardCopy;
