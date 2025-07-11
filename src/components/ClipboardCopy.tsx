"use client";
import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyIcon, CheckIcon } from "@phosphor-icons/react";
import { toast } from "@/lib/hooks/use-toast";

interface ClipboardCopyProps {
    textToCopy?: string;
    className?: string;
    variant?: "default" | "ghost" | "outline";
    size?: "sm" | "default" | "icon";
    showToast?: boolean;
    children?: React.ReactNode;
}

const ClipboardCopy: React.FC<ClipboardCopyProps> = ({
    textToCopy,
    className = "",
    variant = "ghost",
    size = "icon",
    showToast = true,
    children,
}) => {
    const [copied, setCopied] = useState<boolean>(false);

    const handleCopy = useCallback(async (): Promise<void> => {
        try {
            const textToWrite = textToCopy || window.location.href;
            await navigator.clipboard.writeText(textToWrite);
            
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);

            if (showToast) {
                toast({
                    title: "Copied!",
                    description: textToCopy 
                        ? "Content copied to clipboard" 
                        : "Link copied to clipboard",
                });
            }
        } catch (err) {
            console.error("Failed to copy text:", err);
            if (showToast) {
                toast({
                    title: "Copy failed",
                    description: "Unable to copy to clipboard. Please try again.",
                    variant: "destructive",
                });
            }
        }
    }, [textToCopy, showToast]);

    return (
        <Button
            onClick={handleCopy}
            variant={variant}
            size={size}
            className={`gap-2 transition-all duration-200 ${className}`}
            aria-label={textToCopy ? "Copy content" : "Copy link"}
        >
            {copied ? (
                <>
                    <CheckIcon className="h-4 w-4 text-green-600" />
                    {children && <span className="text-green-600">Copied!</span>}
                </>
            ) : (
                <>
                    <CopyIcon className="h-4 w-4" />
                    {children}
                </>
            )}
        </Button>
    );
};

export default ClipboardCopy;
