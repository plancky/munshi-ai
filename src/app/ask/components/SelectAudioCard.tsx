import React from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";

import { InputFile } from "./UploadAudio";

interface SelectAudioCardProps extends React.HTMLAttributes<HTMLElement> {}

export default function SelectAudioCard({ ...props }: SelectAudioCardProps) {
    return (
        <section {...props}>
            <Card className="w-full bg-card border border-border shadow-sm">
                <CardHeader className="">
                    <h2 className="font-heading text-base font-semibold text-foreground">Upload Your Audio</h2>
                    <CardDescription className="text-subheading_sm text-muted-foreground">
                        Drop your audio file below and we&apos;ll transcribe it for you.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                            <InputFile />
                </CardContent>
            </Card>
        </section>
    );
}
