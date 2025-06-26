"use client";
import { createContext, useCallback, useReducer } from "react";

import SelectAudioCard from "./SelectAudioCard";
import { Button } from "@/components/ui/button";
import React from "react";
import { toast } from "@/lib/hooks/use-toast";
import { FormStateContextProvider, useFormState } from "./form-state-provider";
import { QueryClient, useMutation } from "@tanstack/react-query";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import Providers from "../../providers";
import { MODAL_URL } from "@/lib/url";

export function AskMunishiSection() {
    return (
        <div className="flex h-full min-h-[calc(100dvh-160px)] w-full justify-center">
            <Providers>
                <FormStateContextProvider>
                    <div className="relative flex w-full max-w-[1080px] flex-col items-center justify-center">
                        <div className="flex min-h-fit w-full max-w-2xl flex-col gap-5 pt-20 lg:flex-row lg:justify-center">
                            <div className="h-full w-full max-w-[1080px] flex-1">
                                <SelectAudioCard className="transition-all duration-200" />
                            </div>
                        </div>
                        <div className="relative w-full flex-initial">
                            <TranscribeButton />
                        </div>
                    </div>
                </FormStateContextProvider>
            </Providers>
        </div>
    );
}

function TranscribeButton() {
    const { formState } = useFormState();
    const url = MODAL_URL + "/transcribe_local";

    const { mutate, isPending, isSuccess, isError, isIdle } = useMutation({
        mutationFn: (vid: string) => {
            const payload = JSON.stringify({
                vid,
            });
            return fetch(url, {
                method: "POST",
                body: payload,
                headers: {
                    "Content-Type": "application/json;",
                },
            }).then((res) => {
                if (res.ok) Promise.resolve(res.json());
                else Promise.reject(res.json());
            });
        },
        onMutate: (variables) => {
            return variables;
        },
        onError: (error, variables, context) => {
            // An error happened!
            toast({
                title: "Failed to initiate transcription!",
                description: "Failed to process request! Retry later!",
            });
        },
        onSuccess: (data, variables, context) => {
            toast({
                title: "Transcription Initiated",
                description: "redirecting...",
            });
            // Boom baby!
            window.history.pushState(
                { id: "output-page" },
                `output-page`,
                `/output/${context}`,
            );
            window.history.go();
        },
        onSettled: (data, error, variables, context) => {
            // Error or success... doesn't matter!
        },
    });

    const onSubmit = useCallback(async () => {
        mutate(formState?.id!);
    }, [formState, mutate]);
    return (
        <>
            <div className="flex w-full justify-center">
                <Button
                    disabled={!formState?.isUploaded || isPending || isSuccess}
                    onClick={() => {
                        onSubmit();
                    }}
                    className="w-full transition-all duration-200 mt-5 max-w-lg font-heading disabled:cursor-not-allowed"
                >
                    {(isIdle || isError) && `Transcribe`}
                    {(isPending || isSuccess) && (
                        <CircleNotchIcon className="animate-spin" size={18} />
                    )}
                </Button>
            </div>
        </>
    );
}
