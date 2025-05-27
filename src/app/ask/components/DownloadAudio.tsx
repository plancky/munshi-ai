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
import { generateAction } from "../actions";
import { extractVideoId, getYTurl } from "../helpers";

const youtubeRegex: RegExp =
    /^(https?:\/\/)?((www\.)?youtu(be\.com|\.be))\/(?:watch\?v=|embed\/|v\/|user\/\S+|[^\/]+\?.*v=)([a-zA-Z0-9_-]{11}).*$/;

const FormSchema = z.object({
    url: z
        .string()
        .url()
        .refine(
            (val: string) => {
                return extractVideoId(val) != null;
            },
            {
                message:
                    "Invalid url for the youtube video, provide the correct url.",
            },
        ),
    /* .regex(
            youtubeRegex,
            "Invalid url for the youtube video, provide the complete url: https://www.youtube.com/watch?v=dQw4w9WgXcQ (example)",
        ),
    */
});

export function DownloadAudioForm() {
    const [loading, setLoading] = React.useState<boolean>(false);
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            url: "",
        },
    });

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        setLoading(true);
        await generateAction({
            url: getYTurl(extractVideoId(data.url)!),
        });
        setLoading(false);
        // window.history.pushState({id: "output-page"}, `output-page`, `/output/${vid}`);
        // window.history.go()
        toast({
            title: "Transcription Initiated",
            description: "redirecting...",
        });
    }
    return (
        <div className="flex w-full flex-[3] flex-col gap-5 lg:flex-row">
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="grid w-full place-items-center"
                >
                    <Card className="w-full !border-0 bg-transparent">
                        <CardHeader>
                            <CardTitle>
                                <span>What would you like to transcipt?</span>
                            </CardTitle>
                            <CardDescription>
                                Link to the audio podcast that you would like
                                munshi to transcript.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-5">
                            <div className="flex flex-col gap-5">
                                <FormField
                                    control={form.control}
                                    name="url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Link to Youtube media
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ (example)"
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
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    form.reset();
                                }}
                            >
                                Reset
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {!loading ? "Go!" : "Redirecting"}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}
