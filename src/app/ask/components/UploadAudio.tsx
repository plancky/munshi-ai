import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormStateContext, useFormState } from "./FormStateProvider";
import React, { useCallback, useState, useEffect } from "react";
import { FormStateActionTypes } from "./FormStateReducer";
import { Icons } from "@/components/icons/icons";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/hooks/use-toast";
import { uploadFile } from "../utils/utils";
import { CheckCircleIcon, UploadIcon } from "@phosphor-icons/react/dist/ssr";
import AudioVisualizer from "@/components/AudioVisualizer";
import { useMutation } from "@tanstack/react-query";
import { MODAL_URL } from "@/lib/url";
import { generateFileHash } from "../utils/utils";

// Wrapper to properly manage blob URL lifecycle
function AudioVisualizerWrapper({
    file,
    className,
}: {
    file: File;
    className: string;
}) {
    const [audioUrl, setAudioUrl] = useState<string>("");

    useEffect(() => {
        const url = URL.createObjectURL(file);
        setAudioUrl(url);

        // Cleanup blob URL when component unmounts or file changes
        return () => {
            URL.revokeObjectURL(url);
        };
    }, [file]);

    if (!audioUrl) return null;

    return <AudioVisualizer audioUrl={audioUrl} className={className} />;
}

export function InputFile() {
    const { formState, dispatch } = React.useContext(FormStateContext);

    const { audioFile } = formState!;
    return (
        <>
            {!audioFile ? (
                <Card className="mx-0 border-2 border-dashed border-primary/30 bg-primary/5 transition-colors duration-200 hover:border-primary/50 hover:bg-primary/10">
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <Label
                            htmlFor="audio"
                            className="block w-full cursor-pointer"
                        >
                            <div className="flex flex-col items-center gap-3">
                                <UploadIcon
                                    size={32}
                                    className="text-primary/60"
                                />
                                <div>
                                    <p className="text-base font-medium">
                                        Drop your audio file here
                                    </p>
                                    <p className="mt-2 text-xs text-muted-foreground/70">
                                        MP3, WAV, M4A • Under 500MB please
                                    </p>
                                </div>
                            </div>
                        </Label>
                        <Input
                            id="audio"
                            type="file"
                            accept=".mp3,.wav,.m4a"
                            className="hidden"
                            onChange={async (event) => {
                                const files = event.target.files;
                                if (files?.length) {
                                    const extension = files[0].name
                                        .split(".")
                                        .pop();
                                    const id = btoa(self.crypto.randomUUID())
                                        .replace("+", "-")
                                        .replace("/", "_")
                                        .replace("-==", "")
                                        .slice(0, 16);

                                    const file = new File(
                                        [
                                            new Blob(
                                                [await files[0].arrayBuffer()],
                                                { type: files[0].type },
                                            ),
                                        ],
                                        id + "." + extension,
                                        { type: files[0].type },
                                    );

                                    // Validate file size (max 500MB)
                                    if (files[0].size > 500 * 1024 * 1024) {
                                        toast({
                                            title: "Whoa there, bigshot",
                                            description:
                                                "That file&apos;s too chunky. Keep it under 500MB.",
                                        });
                                        return;
                                    }

                                    const metadata = {
                                        name: files[0].name,
                                        size: files[0].size,
                                        lastmod: files[0].lastModified,
                                        id,
                                    };

                                    dispatch!({
                                        type: FormStateActionTypes.ADD_AUDIO_FILE,
                                        payload: { file, metadata },
                                    });
                                }
                            }}
                        />
                    </CardContent>
                </Card>
            ) : (
                <VisualAudioFile />
            )}
        </>
    );
}

export function VisualAudioFile() {
    const { formState, dispatch } = React.useContext(FormStateContext);

    const { audioFile } = formState!;

    return (
        <>
            {audioFile && (
                <div className="flex flex-col gap-6">
                    <Card className="mx-0">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="text-primary">📁</div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                        {audioFile.metadata.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {(
                                            audioFile.metadata.size /
                                            1024 /
                                            1024
                                        ).toFixed(1)}{" "}
                                        MB
                                    </p>
                                </div>
                                <Button
                                    variant={"default"}
                                    onClick={(event) => {
                                        dispatch!({
                                            type: FormStateActionTypes.REMOVE_AUDIO_FILE,
                                            payload: {},
                                        });
                                    }}
                                    className="aspect-square h-5 w-5 grow-0 cursor-pointer rounded-sm p-1"
                                >
                                    <Icons.close className="h-full w-full" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {audioFile?.file && (
                        <AudioVisualizerWrapper
                            file={audioFile.file}
                            className="w-full"
                        />
                    )}

                    <UploadButton />
                </div>
            )}
        </>
    );
}

function UploadButton() {
    const { formState, dispatch } = useFormState();
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isCheckingExisting, setIsCheckingExisting] = useState(false);

    const url = MODAL_URL + "/upload_file";

    const { mutate, isPending, isSuccess, isError, isIdle } = useMutation({
        mutationFn: () => {
            return uploadFile(formState.audioFile?.file!, url, (progress) =>
                setUploadProgress(progress),
            );
        },
        onMutate: (variables) => {
            return variables;
        },
        onError: (error, variables, context) => {
            // Check if it was user-cancelled
            if (error instanceof Error && error.name === "AbortError") {
                toast({
                    title: "Changed your mind?",
                    description:
                        "No worries, we&apos;ll be here when you&apos;re ready.",
                });
            } else {
                toast({
                    title: "Oops, that didn&apos;t work",
                    description:
                        "Something went sideways. Give it another shot?",
                });
            }
        },
        onSuccess: (data, variables, context) => {
            dispatch!({
                type: FormStateActionTypes.UPLOADED,
                payload: {
                    id: data.id,
                },
            });
            toast({
                title: "Locked and loaded!",
                description:
                    "Your audio is uploaded and ready to be transcribed.",
            });
        },
        onSettled: (data, error, variables, context) => {},
    });

    const onSubmit = useCallback(async () => {
        if (!formState.audioFile?.file) return;

        try {
            setIsCheckingExisting(true);

            // Generate hash-based vid for checking existing transcript
            const vid = await generateFileHash(formState.audioFile.file);

            // Check if transcript already exists
            const response = await fetch(`${MODAL_URL}/fetch_data`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vid }),
            });

            if (response.ok) {
                const data = await response.json();

                if (data.status === "Completed" && data.data) {
                    // Transcript exists! Redirect to output page
                    toast({
                        title: "We've seen this before! 🎯",
                        description:
                            "This file was already transcribed. Taking you there now...",
                        duration: 3000,
                    });

                    setTimeout(() => {
                        window.location.href = `/output/${vid}`;
                    }, 1500);
                    return;
                }
            }

            // No existing transcript found, proceed with upload
            setIsCheckingExisting(false);
            mutate();
        } catch (error) {
            console.error("Failed to check existing transcript:", error);
            // On error, proceed with upload anyway
            setIsCheckingExisting(false);
            mutate();
        }
    }, [mutate, formState.audioFile]);

    return (
        <>
            <div className="flex w-full">
                {!formState.isUploaded ? (
                    <>
                        {isPending || isCheckingExisting ? (
                            <div className="w-full space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        {isCheckingExisting
                                            ? "Checking if we've seen this before..."
                                            : "Sending it up to the cloud..."}
                                    </span>
                                    {!isCheckingExisting && (
                                        <span className="text-xs text-muted-foreground">
                                            {uploadProgress}%
                                        </span>
                                    )}
                                </div>
                                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={`absolute h-full rounded-full bg-primary transition-all duration-300 ease-out ${
                                            isCheckingExisting
                                                ? "animate-ping"
                                                : ""
                                        }`}
                                        style={{
                                            width: isCheckingExisting
                                                ? "100%"
                                                : `${uploadProgress}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    disabled={
                                        !formState?.audioFile ||
                                        isPending ||
                                        isCheckingExisting
                                    }
                                    onClick={() => {
                                        onSubmit();
                                    }}
                                    className="relative mt-0 max-w-40 font-heading disabled:cursor-not-allowed"
                                >
                                    <span className="flex items-center gap-2">
                                        <UploadIcon size={16} /> upload
                                    </span>
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex w-full justify-end">
                        <span className="flex items-center gap-2">
                            <CheckCircleIcon size={20} /> Uploaded
                        </span>
                    </div>
                )}
            </div>
        </>
    );
}
