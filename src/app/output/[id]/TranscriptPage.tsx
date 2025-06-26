"use client";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import LoadingUI from "./LoadingUI";
import TranscriptCard from "./TranscriptCard";
import { dataFetchOptions } from "./DataFetchOptions";
import { STATUS_CODES } from "http";
import { TRANSCRIPTION_STATUS } from "@/shared/constants";

export function TranscriptPage({ params: { id } }: { params: { id: string } }) {
    // Queries
    const {
        isPending,
        error,
        data: { status, data, metadata },
        isFetching,
    } = useSuspenseQuery(dataFetchOptions(id));

    // const { data, error } = await getTranscript(id);
    const dataIsReady = status === TRANSCRIPTION_STATUS.COMPLETED;
    return dataIsReady ? (
        <>
            <TranscriptCard metadata={metadata} data={data} id={id} />
        </>
    ) : (
        <LoadingUI state={status} />
    );
}
