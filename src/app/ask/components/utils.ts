const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB per chunk

/**
 * Upload a file to the server in independent chunks
 * @param file - The file to upload
 * @param uploadUrl - The server endpoint that accepts chunk uploads
 */
export async function uploadFileInChunks(
    file: File,
    metadata: any,
    uploadUrl: string,
    progressBar: HTMLDivElement | null,
) {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadPromises: Promise<Response>[] = [];
    let uploadedChunks = 0;
    let fileId;

    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("chunkIndex", i.toString());
        formData.append("totalChunks", totalChunks.toString());
        //formData.append("metadata", metadata);
        formData.append("fileName", file.name);

        try {
            const response = await fetch(uploadUrl, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                console.error(`Chunk ${i} failed.`);
                return Promise.reject(`Chunk ${i} failed`);
            }

            uploadedChunks++;
            const percentComplete = Math.round(
                (uploadedChunks / totalChunks) * 100,
            );
            progressBar?.style?.setProperty("--filled", `${percentComplete}%`);

            if (i == totalChunks - 1) {
                const data = await response.json();
                fileId = data?.id;
            }
        } catch (err) {
            return Promise.reject(err);
        }
    }
    return { id: fileId as string };
}
