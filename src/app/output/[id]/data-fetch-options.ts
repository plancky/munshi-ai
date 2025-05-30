import { queryOptions } from "@tanstack/react-query";
import { ModedOutputObject } from "../../api/get/types";

export function dataFetchOptions(id: string) {
    return queryOptions({
        queryKey: ["output_data", id],
        queryFn: async ({ queryKey }) => {
            const [_key, vid] = queryKey;
            return await getTranscript(vid) as ModedOutputObject;
        },
        refetchInterval: (query) => {
            const data = query?.state?.data;
            return data?.status.toLowerCase() == "completed" ? false : 5000;
        },
        refetchIntervalInBackground: true,
    });
}

async function getTranscript(id: string) {

    const url = new URL(
        "/api/get",
        process.env.NODE_ENV == "production"
            ? process.env.BASE_URL
            : "http://localhost:3000",
    );

    url.searchParams.set("id", id);

    const res = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        next: {
            revalidate: 5,
        },
    });
    return await res.json();
}
