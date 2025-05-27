import { Card, CardContent, CardHeader } from "@/components/ui/card";

type TranscriptPageParams = {
    id: string;
};
type PageProps = {
    params: TranscriptPageParams;
};

async function getTranscript(id: string) {
    const formData = new FormData();
    formData.append("call_id", id);
    const API_URL = "https://plancky--whisper-v3-entrypoint-dev.modal.run";

    return await fetch(API_URL + "/call_id", {
        method: "POST",
        body: formData,
        next: {
            revalidate: 3000,
        },
    })
        .then(async (response) => {
            if (response.status === 202) {
                console.log("Waiting for transcript...");
            } else {
                return response.json();
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
}

export default async function TranscriptPage({ params: { id } }: PageProps) {
    const { data, error } = await getTranscript(id);
    if (!data)
        return (
            <Card>
                <CardContent>Not found</CardContent>
            </Card>
        );
    if (data[0]?.text) {
        return (
            <div className="flex gap-5 py-20">
                <div className="w-fit">
                    <Card className="max-w-[600px]">
                        <CardHeader>Transcript as text</CardHeader>
                        <CardContent>{data[0]?.text}</CardContent>
                    </Card>
                </div>
                {/*
                <div className="flex w-full flex-col gap-5">
                    {data[0]?.chunks.map((chunk) => (
                        <Card className="" key={chunk.timestamp}>
                            <CardHeader>{chunk?.timestamp}</CardHeader>
                            <CardContent>{chunk?.text}</CardContent>
                        </Card>
                    ))}
                </div>
                */}
            </div>
        );
    }
}
