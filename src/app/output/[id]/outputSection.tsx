"use client";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import LoadingUI, { LoadingStates } from "./LoadingUI";
import TranscriptCard from "./TranscriptCard";
import { dataFetchOptions } from "./data-fetch-options";

export function TranscriptPage({ params: { id } }: { params: { id: string } }) {
    // Queries
    const { isPending, error, data: { status, data }, isFetching } = useSuspenseQuery(
        dataFetchOptions(id),
    );

    // const { data, error } = await getTranscript(id);
    const dataIsReady =
        data?.status?.toLowerCase() == LoadingStates.completed.toLowerCase();
    return dataIsReady ? (
        <>
            <TranscriptCard data={data} id={id} />
        </>
    ) : (
        <LoadingUI state={status} />
    );
}
