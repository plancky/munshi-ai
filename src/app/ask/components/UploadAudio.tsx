import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormStateContext, useFormState } from "./form-state-provider";
import React, { useCallback, useRef } from "react";
import { FormStateActionTypes } from "./FormStateReducer";
import { Icons } from "@/components/icons/icons";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/hooks/use-toast";
import { uploadFileInChunks } from "./utils";
import { CheckCircleIcon, UploadIcon } from "@phosphor-icons/react/dist/ssr";
import { useMutation } from "@tanstack/react-query";
import { MODAL_URL } from "@/lib/url";

export function InputFile() {
    const { formState, dispatch } = React.useContext(FormStateContext);

    const { audioFile } = formState!;
    return (
        <>
            {!audioFile ? (
                <div className="flex flex-col gap-2">
                    <Label htmlFor="audio">Upload Audio File</Label>
                    <Input
                        id="audio"
                        type="file"
                        accept=".mp3"
                        className="!w-fit"
                        onChange={async (event) => {
                            const value = event.target.value;
                            const files = event.target.files;
                            if (files?.length) console.log(files[0]);
                            if (files?.length) {
                                const id = btoa(self.crypto.randomUUID())
                                    .replace("+", "-")
                                    .replace("/", "_")
                                    .replace("-==", "")
                                    .slice(0, 16);

                                const file = new File(
                                    [new Blob([await files[0].arrayBuffer()])],
                                    id,
                                );

                                const metadata = {
                                    name: files[0].name,
                                    size: files[0].size,
                                    lastmod: files[0].type,
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
                    <div className="flex w-full flex-1 flex-col gap-4 py-2">
                        <div className="flex w-full items-center justify-between">
                            <div className="w-[90%] max-w-full flex-1 basis-4/5 overflow-clip">
                                <h2 className="hyphens-auto text-wrap font-heading text-subheading_sm lg:text-subheading">
                                    {audioFile.metadata.name}
                                </h2>
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
                            <audio
                                controls
                                src={URL.createObjectURL(audioFile.file)}
                            ></audio>
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
            // An error happened!
            toast({
                title: "Failed to Upload!",
                description: "Could not upload! Retry later!",
            });
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
    }, [formState, formState, dispatch, mutate]);

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
