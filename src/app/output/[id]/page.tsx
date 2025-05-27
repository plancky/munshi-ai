import { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { TranscriptPage } from "./outputSection";
import { getQueryClient } from "@/app/get-query-client";
import { dataFetchOptions } from "./data-fetch-options";
import Providers from "@/app/providers";

export const metadata: Metadata = {
    title: "Munshi | Transcript",
    description:
        "   An AI-powered assistant that transcribes and summarises audio so that you don't have to.",
};

type TranscriptPageParams = {
    id: string;
};

type PageProps = {
    params: TranscriptPageParams;
};

export default function TranscriptPageWrapper({ params: { id } }: PageProps) {
    const queryClient = getQueryClient();
    void queryClient.prefetchQuery(dataFetchOptions(id));

    return (
        <>
            <Providers>
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <TranscriptPage params={{ id }} />
                </HydrationBoundary>
            </Providers>
        </>
    );
}
