import { MODAL_URL } from "@/lib/url";

export function getSummary(id: string) {
    const payload = JSON.stringify({
        vid: id,
    });

    return fetch(MODAL_URL + "/summarize", {
        method: "POST",
        body: payload,
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                throw Error("Something went wrong.");
            }
        })
        .then((data) => {
            console.log("Success:", data);
            return { data, error: null };
        })
        .catch((error) => {
            console.error("Error:", error);
            throw Error("Something went wrong.");
            return { error, data: null };
        });
}
