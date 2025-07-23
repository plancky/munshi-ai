"use client";
import { useCallback } from "react";

import SelectAudioCard from "./SelectAudioCard";
import { SpeakerSettings } from "./SpeakerSettings";
import { Button } from "@/components/ui/button";
import React from "react";
import { toast } from "@/lib/hooks/use-toast";
import { FormStateContextProvider, useFormState } from "./FormStateProvider";
import { useMutation } from "@tanstack/react-query";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import Providers from "../../providers";
import { MODAL_URL } from "@/lib/url";

export function AskMunishiSection() {
    return (
        <div className="flex h-full w-full justify-center pt-16">
            <Providers>
                <FormStateContextProvider>
                    <div className="relative flex w-full max-w-[1080px] flex-col items-center justify-center">
                        <div className="flex min-h-fit w-full max-w-2xl flex-col gap-5">
                            <SelectAudioCard className="transition-all duration-200" />
                            <SpeakerSettings />
                        </div>
                        <div className="relative w-full flex-initial mb-4">
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
        mutationFn: (params: { vid: string; enableSpeakers: boolean; numSpeakers: number }) => {
            const payload = JSON.stringify({
                vid: params.vid,
                enable_speakers: params.enableSpeakers,
                num_speakers: params.numSpeakers,
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
                title: "Houston, we have a problem",
                description: "Something went wrong on our end. Try again in a moment!",
            });
        },
        onSuccess: (data, variables, context) => {
            toast({
                title: "We're on it!",
                description: "Redirecting you to watch the magic happen...",
            });
            // Boom baby!
            window.history.pushState(
                { id: "output-page" },
                `output-page`,
                `/output/${variables.vid}`,
            );
            window.history.go();
        },
        onSettled: (data, error, variables, context) => {
            // Error or success... doesn't matter!
        },
    });

    const onSubmit = useCallback(async () => {
        mutate({
            vid: formState?.id!,
            enableSpeakers: formState?.enableSpeakers!,
            numSpeakers: formState?.numSpeakers!,
        });
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
