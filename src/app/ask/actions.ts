"use server";

import { redirect } from "next/navigation";
import { extractVideoId } from "./helpers";
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
export async function generateAction(clientInputData: any) {
    // console.log(clientInputData.mediaUrl, process.env.NEXT_PUBLIC_MODAL_APP + "/transcribe")
    console.log(clientInputData);
    const payload = JSON.stringify({
        url: clientInputData?.url,
        audiofile: clientInputData?.audiofile
    });
    console.log(payload)

    const { data, error } = await fetch(
        (process.env.NODE_ENV !== "production"
            ? process.env.NEXT_PUBLIC_MODAL_APP_DEV
            : process.env.NEXT_PUBLIC_MODAL_APP) + "/transcribe_file",
        {
            method: "POST",
            body: payload,
            headers: {
                "Content-Type": "application/json",
            },
            next: {
                revalidate: 3,
            },
        },
    )
        .then(async (response) => {
            if (response.ok) {
                return await response.json();
            } else {
                throw Error(
                    `Something went wrong. ${JSON.stringify(await response.json())}`,
                );
            }
        })
        .then((data) => {
            console.log("Success:", data);
            return { data, error: null };
        })
        .catch((error) => {
            console.error("Error:", error);
            return { error, data: null };
        });
    if (error) {
        return { error: 1 };
    }
    // TBD: To be removed later, sleep for 5 seconds to wait for modal to process the request.
    sleep(5000);

    const vid = extractVideoId(clientInputData.url);
    redirect(`/output/${vid}`);
}
