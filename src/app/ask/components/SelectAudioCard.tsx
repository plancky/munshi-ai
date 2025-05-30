import React from "react";
import { FormStateContext } from "./form-state-provider";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { AudioSelectMethod, FormStateActionTypes } from "./FormStateReducer";
import { InputFile, VisualAudioFile } from "./UploadAudio";
import { DownloadAudioForm } from "./DownloadAudio";

interface SelectAudioCardProps extends React.HTMLAttributes<HTMLElement> {}

export default function SelectAudioCard({ ...props }: SelectAudioCardProps) {
    const { formState, dispatch } = React.useContext(FormStateContext);

    const { audioSelectMethod } = formState!;

    return (
        <section {...props}>
            <Card className="w-full bg-transparent">
                <CardHeader className="">
                    <div className="mb-2 flex justify-between gap-4 font-heading text-md">
                        <h2 className="flex-1">Audio Selection</h2>
                        <div className="flex items-start">
                            <AudioSelectMethodToggleGroup />
                        </div>
                    </div>
                    <CardDescription className="text-subheading_sm">
                        <span>
                            Select audio method, <br></br> Download the audio
                            directly from an external source url or Upload the
                            audio file. (Audio Downloads are currently diasabled.)
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                    {audioSelectMethod == AudioSelectMethod.UPLOAD ? (
                        <>
                            <InputFile />
                        </>
                    ) : (
                        audioSelectMethod == AudioSelectMethod.DOWNLOAD && (
                            <>
                                <DownloadAudioForm />
                            </>
                        )
                    )}
                </CardContent>
            </Card>
        </section>
    );
}

export function AudioSelectMethodToggleGroup() {
    const { formState, dispatch } = React.useContext(FormStateContext);

    return (
        <ToggleGroup
            type="single"
            value={formState?.audioSelectMethod!}
            onValueChange={(value: AudioSelectMethod) => {
                if (value) {
                    dispatch!({
                        type: FormStateActionTypes.AUDIO_METHOD_MUTATION,
                        payload: { value: value },
                    });
                }
            }}
            className="inline-flex gap-0 border-0 bg-transparent"
        >
            {[
                {
                    value: AudioSelectMethod.UPLOAD,
                    label: "Upload",
                    icon: {},
                    tooltipcontent: "Upload Audio file.",
                    position: "first",
                },
                {
                    value: AudioSelectMethod.DOWNLOAD,
                    label: "Download",
                    icon: {},
                    disabled: true,
                    tooltipcontent: "Audio Downloads are currently diasabled.",
                    position: "last",
                },
            ].map((item) => (
                <ToggleGroupItem
                    key={item.value}
                    disabled={item.disabled}
                    value={item.value}
                    aria-label={`Toggle ${item.label.toLowerCase()}`}
                    className={cn(
                        "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
                        "border border-input",
                        "flex h-9 items-center justify-center px-5",
                        "transition-all duration-100",
                        "hover:bg-muted",
                        item.position === "first" &&
                            "rounded-l-md rounded-r-none border-r-0",
                        item.position === "middle" && "rounded-none border-r-0",
                        item.position === "last" &&
                            "rounded-l-none rounded-r-md",
                    )}
                >
                    {item.label}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    );
}
