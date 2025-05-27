"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { toast } from "@/src/lib/hooks/use-toast";
import { Dispatch, SetStateAction, createContext, useState } from "react";

import { DownloadAudioCard } from "./DownloadAudioCard";
import { GenerateTranscriptForm } from "./GenerateTranscriptForm";

type MasterFormStateContext = {
    audioFileState?: AudioFileState | null;
    setAudioFileState?: Dispatch<SetStateAction<AudioFileState | undefined>>;
};

export const masterFormStateContext = createContext<MasterFormStateContext>({
    audioFileState: null,
});

type AudioFileState = {
    audioFile: File;
    md: any;
};

export function AskMunishiSection() {
    const [audioFileState, setAudioFileState] = useState<AudioFileState>();

    const value = {
        audioFileState,
        setAudioFileState,
    };

    return (
        <masterFormStateContext.Provider value={value}>
            <div className="flex w-full flex-col items-center justify-center gap-5 lg:flex-row">
                <div className="h-full w-full max-w-[1080px] flex-1">
                    <DownloadAudioCard />
                </div>
                <div className="h-full w-full max-w-[420px] flex-1">
                    <GenerateTranscriptForm />
                </div>
            </div>
        </masterFormStateContext.Provider>
    );
}
