import { queryOptions } from "@tanstack/react-query";

export function dataFetchOptions(id: string) {
    return queryOptions({
        queryKey: ["fetch_data", id],
        queryFn: async ({ queryKey }) => {
            const [_key, vid] = queryKey;
            return await getTranscript(vid);
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
    console.log(url.toString())

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
