import { MODAL_URL } from "@/lib/url";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { cleanSummaryHtmlString, formatTranscriptInParagraphs } from "./utils";
import { TRANSCRIPTION_STATUS } from "@/shared/constants";
import { OutputObject } from "@/shared/types";
import { ModedOutputDataObject, ModedOutputObject } from "./types";

const NEXT_CACHE_OUTPUT_TAG = (id: string) => `output_${id}`;

export async function GET(req: NextRequest) {
    try {
        const id = req.nextUrl.searchParams.get("id");

        if (!id || typeof id == "undefined") {
            throw new Error("'id' is missing on the payload of get req.");
        }

        const resObject = await fetchTranscript(id!);

        const modedResObject: ModedOutputObject = { ...resObject };

        if (!resObject?.status || resObject?.status !== TRANSCRIPTION_STATUS.COMPLETED) {
            revalidateTag(NEXT_CACHE_OUTPUT_TAG(id));
        }

        const dataObject = modedResObject?.data;

        if (typeof dataObject !== "undefined") {
            const { summary_gemini: summary, text } = dataObject;
            if (summary) {
                dataObject.summary_gemini = cleanSummaryHtmlString(summary);
            }
            if (text) {
                dataObject.paras = formatTranscriptInParagraphs(text, 200);
            }
        }

        console.log(
            modedResObject?.status,
            modedResObject?.metadata
        );

        return NextResponse.json(modedResObject, { status: 200 });
    } catch (e) {
        return NextResponse.json({ error: e }, { status: 400 });
    }
}

async function fetchTranscript(id: string) {
    const payload = JSON.stringify({
        vid: id,
    });

    const res = await fetch(MODAL_URL + "/fetch_data", {
        method: "POST",
        body: payload,
        headers: {
            "Content-Type": "application/json",
        },
        next: {
            tags: [NEXT_CACHE_OUTPUT_TAG(id)],
        },
    });
    if (!res.ok) {
        throw Error("Transcript does not exist!");
    }
    return (await res.json()) as OutputObject;
}
