"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { toast } from "@/lib/hooks/use-toast";
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

import { useContext, useState } from "react";

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
import { redirect } from "next/dist/server/api-utils";

const FormSchema = z.object({
    email: z.string().email(),
});

export function GenerateTranscriptForm() {
    const [loading, setLoading] = useState<boolean>(false);
    const { audioFileState } = useContext(masterFormStateContext);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: "",
        },
    });

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        setLoading(true);
        const formdat = new FormData();
        formdat.append("audio", audioFileState?.audioFile!);
        setLoading(false);

        toast({
            title: "Scheduled: Catch up",
            description: "Friday, February 10, 2023 at 5:57 PM",
        });
    }

    return (
        <div className="flex w-full flex-col gap-5 lg:flex-row">
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="grid w-full place-items-center"
                >
                    <Card className="w-full lg:max-w-md">
                        <CardHeader>
                            <CardTitle className="font-heading text-md mb-2">
                                Settings
                            </CardTitle>
                            <CardDescription className=" text-subheading_sm font-heading">
                                settings for transcription
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-5">
                            <div className="flex flex-col gap-5">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="example@google.com"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                The transcription will be sent
                                                to this email
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={loading && audioFileState !== null}
                            >
                                {!loading ? "Save" : "loading..."}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}
