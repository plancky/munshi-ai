import { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { TranscriptPage } from "./TranscriptPage";
import { getQueryClient } from "@/app/GetQueryClient";
import { dataFetchOptions } from "./DataFetchOptions";
import Providers from "@/app/providers";

export const metadata: Metadata = {
    title: "Munshi | Transcript",
    description: "AI-powered audio transcription and summarization results.",
};

type TranscriptPageParams = Promise<{
    id: string;
}>;

type PageProps = {
    params: TranscriptPageParams;
};

export default async function TranscriptPageWrapper({ params }: PageProps) {
    const { id } = await params;
    const queryClient = getQueryClient();
    void queryClient.prefetchQuery(dataFetchOptions(id));

    return (
        <Providers>
            <HydrationBoundary state={dehydrate(queryClient)}>
                <TranscriptPage params={{ id }} />
            </HydrationBoundary>
        </Providers>
    );
}
