"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { toast } from "@/src/lib/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import * as React from "react";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import Waveform from "./waveform";
import { masterFormStateContext } from "./askMunshiSection";

const FormSchema = z.object({
    mediaUrl: z.string().url(),
});

export function DownloadAudioCard() {
    const [loading, setLoading] = React.useState<boolean>(false);
    const { setAudioFileState, audioFileState } = React.useContext(
        masterFormStateContext,
    );

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            mediaUrl: "",
        },
    });

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        setLoading(true);
        const blob = await fetch("/api/downloadAudio", {
            method: "post",
            body: JSON.stringify(data),
            headers: {},
        }).then((res) => {
            return (async () => {
                if (res.ok) {
                    const metadata = JSON.parse(
                        res.headers.get("X-file-metadata") ?? "",
                    );
                    const fileData = await res.blob();
                    setAudioFileState!((prev) => ({
                        ...prev,
                        md: metadata,
                        audioFile: new File([fileData], "audio.mp3") as File,
                    }));
                }
            })();
        });
        setLoading(false);

        toast({
            title: "Scheduled: Catch up",
            description: "Friday, February 10, 2023 at 5:57 PM",
        });
    }

    const videoTitle = React.useMemo(() => {
        return audioFileState?.md.title;
    }, [audioFileState]);

    /*
    React.useEffect(() => {
        fetch("/api/test", { method: "GET" })
            .then(async (res) => {
                const { fname, title } = JSON.parse(
                    res.headers.get("X-file-metadata") ?? "",
                );
                console.log(title);
                return {
                    filedata: await res.blob(),
                    filename: fname,
                    title: title,
                };
            })
            .then(
                (data: {
                    filedata: Blob;
                    filename: string | null;
                    title: string;
                }) => {
                    if (data?.filedata) {
                        currentFile.current = new File(
                            [data?.filedata],
                            data?.filename!,
                        ) as File;
                        setFileState(true);
                        setTitle(data.title);
                    }
                },
            );
    }, []);
    */

    return (
        <div className="flex w-full flex-[3] flex-col gap-5 lg:flex-row">
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="grid w-full place-items-center"
                >
                    <Card className="w-full !border-0 bg-transparent">
                        <CardHeader>
                            <CardTitle>Select audio file</CardTitle>
                            <CardDescription>
                                Select audio file that you would like to
                                transcribe.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-5">
                            <div className="flex flex-col gap-5">
                                <FormField
                                    control={form.control}
                                    name="mediaUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Link to Youtube media
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Put in the complete url
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {audioFileState && (
                                    <div className="flex flex-col gap-4 border-y border-input py-5">
                                        <h2 className="text-lg lg:text-xl">
                                            {videoTitle}
                                        </h2>
                                        {audioFileState && (
                                            <Waveform
                                                file={
                                                    audioFileState
                                                        ? audioFileState.audioFile!
                                                        : new File(
                                                              [
                                                                  new Blob([
                                                                      "something",
                                                                  ]),
                                                              ],
                                                              "audio.mp3",
                                                          )
                                                }
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline">Reset</Button>
                            <Button type="submit" disabled={loading}>
                                {!loading ? "Download" : "Downloading"}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}
