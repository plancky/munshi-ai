import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormStateContext } from "./AskMunshiSection";
import React from "react";
import { FormStateActionTypes } from "./FormStateReducer";
import Waveform from "@/components/waveform";
import { Icons } from "@/components/icons/icons";
import { Button } from "@/components/ui/button";

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
                        onChange={(event) => {
                            const value = event.target.value;
                            const files = event.target.files;
                            if (files?.length) console.log(files[0]);
                            if (files?.length) {
                                dispatch!({
                                    type: FormStateActionTypes.ADD_AUDIO_FILE,
                                    payload: { file: files[0] },
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
                <div className="flex gap-1">
                    <div className="flex flex-1 flex-col gap-4 py-2">
                        <div className="flex items-center justify-between">
                            <h2 className="font-heading text-subheading_sm lg:text-subheading">
                                {audioFile.file.name}
                            </h2>
                            <Button
                                variant={"default"}
                                onClick={(event) => {
                                    dispatch!({
                                        type: FormStateActionTypes.REMOVE_AUDIO_FILE,
                                    });
                                }}
                                className="aspect-square h-5 w-5 p-1 rounded-sm cursor-pointer"
                            >
                                <span>
                                    <Icons.close className="h-full w-full" />
                                </span>
                            </Button>
                        </div>

                        <audio
                            controls
                            src={URL.createObjectURL(audioFile.file)}
                        ></audio>
                        {/*
                        <Waveform
                            file={
                                audioFile.file
                                    ? audioFile.file
                                    : new File(
                                          [new Blob(["something"])],
                                          "audio.mp3",
                                      )
                            }
                        />
                        */}
                    </div>
                </div>
            )}
        </>
    );
}
