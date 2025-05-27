"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import { VideoTitleIcon } from "@/components/videoTitleIcon";
import { Icons } from "@/components/icons/icons";

import { getSummary } from "./utils";
const { VideoTitleIcon, AuthorIcon } = Icons;

type MunshiOutput = {
    data: any;
    title: string[] | null;
    author: string[] | null;
};

export default function TranscriptCard({
    data: dataProp,
    id: idProp,
}: {
    data: MunshiOutput;
    id: string;
}) {
    const { text, summary_gemini, paras } = dataProp?.data;
    const { title: audioTitle, author } = dataProp;
    return (
        <div className="z-0 grid w-full grid-cols-1 grid-rows-1 place-items-center pb-20 pt-28 lg:pt-40">
            <div className="z-0 col-span-1 row-span-1 flex h-full flex-col items-start gap-5 lg:max-w-[1020px]">
                {summary_gemini && (
                    <Card className="relative -z-10 flex h-full flex-1 flex-col border-0 bg-background bg-opacity-20 pb-5 backdrop-blur-md">
                        <CardHeader>
                            {audioTitle && (
                                <>
                                    <div className="space-x-2 align-middle text-xl">
                                        <span className="text-xl">
                                            <VideoTitleIcon className="inline-block aspect-square w-[2rem] lg:w-[2.5rem]" />
                                        </span>
                                        <span className="h-7 hyphens-auto text-wrap py-1 text-center font-heading text-lg leading-5 lg:text-xl">
                                            {audioTitle[0]}
                                        </span>
                                    </div>
                                </>
                            )}
                            {author && (
                                <div className="text-subheading flex items-center gap-2 font-heading">
                                    <>
                                        <span className="h-4">
                                            <AuthorIcon className="h-full w-full" />
                                        </span>
                                        <span>{author[0]}</span>
                                    </>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="flex h-full flex-1 flex-col">
                            <span className="text-md mb-5 font-heading lg:text-lg">
                                Summary
                            </span>
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: summary_gemini,
                                }}
                                className="h-full pr-2"
                            ></div>
                        </CardContent>
                    </Card>
                )}
                <Card className="flex flex-col">
                    <CardHeader>
                        <span className="text-md lg:text-lg">Transcript</span>
                        {!summary_gemini && (
                            <Button
                                onClick={() => {
                                    getSummary(idProp);
                                }}
                            >
                                Summarize
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="h-full pb-5 [&_p]:mb-5">
                        {paras?.map((para, _i) => (
                            <p key={`para_${_i}`}>{para}</p>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
