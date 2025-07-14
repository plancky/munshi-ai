import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormStateContext, useFormState } from "./FormStateProvider";
import React, { useCallback, useRef } from "react";
import { FormStateActionTypes } from "./FormStateReducer";
import { Icons } from "@/components/icons/icons";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/hooks/use-toast";
import { uploadFileInChunks } from "./utils";
import { CheckCircleIcon, UploadIcon } from "@phosphor-icons/react/dist/ssr";
import AudioVisualizer from "@/components/AudioVisualizer";
import { useMutation } from "@tanstack/react-query";
import { MODAL_URL } from "@/lib/url";

// Wrapper to properly manage blob URL lifecycle
function AudioVisualizerWrapper({ file, className }: { file: File; className: string }) {
    const [audioUrl, setAudioUrl] = React.useState<string>("");

    React.useEffect(() => {
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
                <div className="border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center text-muted-foreground hover:border-primary/50 hover:bg-primary/10 transition-colors duration-200 rounded-lg">
                    <Label htmlFor="audio" className="cursor-pointer block w-full">
                        <div className="flex flex-col items-center gap-3">
                            <UploadIcon size={32} className="text-primary/60" />
                            <div>
                                <p className="font-heading text-base">Drop your audio file here</p>
                                <p className="text-sm">or click to browse</p>
                                <p className="text-xs text-muted-foreground/70 mt-2">Supports MP3 files</p>
                            </div>
                        </div>
                    </Label>
                    <Input
                        id="audio"
                        type="file"
                        accept=".mp3"
                        className="hidden"
                        onChange={async (event) => {
                            const files = event.target.files;
                            if (files?.length) {
                                const id = btoa(self.crypto.randomUUID())
                                    .replace("+", "-")
                                    .replace("/", "_")
                                    .replace("-==", "")
                                    .slice(0, 16);

                                const file = new File(
                                    [new Blob([await files[0].arrayBuffer()], { type: files[0].type })],
                                    id,
                                    { type: files[0].type }
                                );

                                // Validate file size (max 500MB)
                                if (files[0].size > 500 * 1024 * 1024) {
                                    toast({
                                        title: "File too large",
                                        description: "Please select a file smaller than 500MB.",
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
                </div>
            ) : (
                <>
                    <VisualAudioFile />
                </>
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
                <div className="flex w-full max-w-full gap-1">
                    <div className="flex w-full flex-1 flex-col gap-6 py-2">
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border">
                            <div className="text-primary">📁</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{audioFile.metadata.name}</p>
                                <p className="text-xs text-muted-foreground">MP3 • {(audioFile.metadata.size / 1024 / 1024).toFixed(1)} MB</p>
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

                        {audioFile?.file && (
                            <AudioVisualizerWrapper 
                                file={audioFile.file}
                                className="w-full"
                            />
                        )}

                        <UploadButton />
                    </div>
                </div>
            )}
        </>
    );
}

function UploadButton() {
    const { formState, dispatch } = useFormState();
    const progressBar = useRef<HTMLDivElement>(null);

    const url = MODAL_URL + "/upload_file";

    const { mutate, isPending, isSuccess, isError, isIdle } = useMutation({
        mutationFn: () => {
            return uploadFileInChunks(
                formState.audioFile?.file!,
                formState.audioFile?.metadata,
                url,
                progressBar.current,
            );
        },
        onMutate: (variables) => {
            return variables;
        },
        onError: (error, variables, context) => {
            // Check if it was user-cancelled
            if (error instanceof Error && error.name === 'AbortError') {
                toast({
                    title: "Upload Cancelled",
                    description: "File upload was cancelled by user.",
                });
            } else {
                toast({
                    title: "Failed to Upload!",
                    description: "Could not upload! Retry later!",
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
                title: "Uploaded",
                description: "Data uploaded.",
            });
        },
        onSettled: (data, error, variables, context) => {},
    });

    const onSubmit = useCallback(async () => {
        mutate();
    }, [mutate]);

    return (
        <>
            <div ref={progressBar} className="flex w-full">
                {!formState.isUploaded ? (
                    <>
                        {isPending ? (
                            <div className="relative h-5 w-full rounded-lg bg-slate-400">
                                <div className="absolute h-full w-[var(--filled,0%)] rounded-lg bg-green-300"></div>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    disabled={!formState?.audioFile || isPending}
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
