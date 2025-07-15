"use client";
import { useSuspenseQuery } from "@tanstack/react-query";
import LoadingUI from "./LoadingUI";
import TranscriptCard from "./TranscriptCard";
import { dataFetchOptions } from "./DataFetchOptions";
import { TRANSCRIPTION_STATUS } from "@/shared/constants";

export function TranscriptPage({ params: { id } }: { params: { id: string } }) {
    // Queries
    const {
        data: { status, data, metadata },
    } = useSuspenseQuery(dataFetchOptions(id));

    const dataIsReady = status === TRANSCRIPTION_STATUS.COMPLETED;

    return dataIsReady ? (
        <>
            <TranscriptCard metadata={metadata} data={data} id={id} />
        </>
    ) : (
        <LoadingUI state={status} />
    );
}
