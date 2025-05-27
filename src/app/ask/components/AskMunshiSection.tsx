"use client";
import { createContext, useReducer } from "react";

import { GenerateTranscriptForm } from "../../../components/GenerateTranscriptForm";
import SelectAudioCard from "./SelectAudioCard";
import {
    AudioSelectMethod,
    audioSelectReducer,
    FormActions,
    FormState,
} from "./FormStateReducer";
import { VisualAudioFile } from "./UploadAudio";
import { Button } from "@/components/ui/button";

type FormStateContext = {
    formState: FormState;
    dispatch?: React.Dispatch<FormActions>;
};

const InitialFormState: FormState = {
    audioSelectMethod: AudioSelectMethod.UPLOAD,
};

export const FormStateContext = createContext<FormStateContext>({
    formState: InitialFormState,
    dispatch: undefined,
});

export function AskMunishiSection() {
    const [state, dispatch] = useReducer(audioSelectReducer, InitialFormState);

    return (
        <div className="flex w-full h-full justify-center">
            <FormStateContext.Provider value={{ formState: state, dispatch }}>
                <div className="relative w-full max-w-[1080px]">
                    <div className="flex w-full flex-col gap-5 min-h-[712px] pt-20 lg:flex-row lg:justify-center">
                        <div className="h-full w-full max-w-[1080px] flex-1">
                            <SelectAudioCard className="transition-all duration-200" />
                        </div>
                        <div className="h-full w-full flex-1 lg:max-w-md">
                            <GenerateTranscriptForm />
                        </div>
                    </div>
                    <div className="relative w-full flex-initial">
                        <TranscribeButton />
                    </div>
                </div>
            </FormStateContext.Provider>
        </div>
    );
}

export function TranscribeButton() {
    return (
        <>
            <div className="w-full flex ">
                <Button
                    disabled
                    className="mt-5 !w-full max-w-lg font-heading disabled:cursor-not-allowed"
                >
                    Transcribe
                </Button>
            </div>
        </>
    );
}
