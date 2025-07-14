import { toast } from "@/lib/hooks/use-toast";

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB per chunk
const MAX_CONCURRENT_UPLOADS = 5; // Parallel upload limit

/**
 * Upload a file to the server in parallel chunks
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
    let uploadedChunks = 0;

    // Create all upload promises
    const uploadPromises = Array.from({ length: totalChunks }, (_, i) => {
        return async () => {
            const start = i * CHUNK_SIZE;
            const end = Math.min(file.size, start + CHUNK_SIZE);
            const chunk = file.slice(start, end);

            const formData = new FormData();
            formData.append("chunk", chunk);
            formData.append("chunkIndex", i.toString());
            formData.append("totalChunks", totalChunks.toString());
            formData.append("fileName", file.name);
            formData.append("metadata", JSON.stringify(metadata));

            const response = await fetch(uploadUrl, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Chunk ${i} failed with status ${response.status}`);
            }

            // Update progress
            uploadedChunks++;
            const percentComplete = Math.round((uploadedChunks / totalChunks) * 100);
            progressBar?.style?.setProperty("--filled", `${percentComplete}%`);

            return { chunkIndex: i, response };
        };
    });

    // Execute uploads in batches of MAX_CONCURRENT_UPLOADS
    const results: { chunkIndex: number; response: Response }[] = [];
    
    for (let i = 0; i < uploadPromises.length; i += MAX_CONCURRENT_UPLOADS) {
        const batch = uploadPromises.slice(i, i + MAX_CONCURRENT_UPLOADS);
        const batchResults = await Promise.all(batch.map(fn => fn()));
        results.push(...batchResults);
    }
    
    // Check all chunk responses for file ID since parallel uploads can complete out of order
    for (const result of results) {
        try {
            const data = await result.response.json();
            
            if (data?.id) {
                // Check if transcript already exists
                if (data.status === "transcript_exists") {
                    toast({
                        title: "Transcript Found!",
                        description: "This file was already transcribed. Redirecting to results...",
                    });
                    
                    // Redirect immediately to existing transcript
                    window.location.href = `/output/${data.id}`;
                    return { id: data.id, exists: true };
                }
                
                // New upload completed successfully
                return { id: data.id, exists: false };
            }
        } catch (e) {
            console.warn(`Failed to parse chunk ${result.chunkIndex}:`, e);
        }
    }
    
    // If no chunk returned an ID, the upload failed
    toast({
        title: "Upload failed!",
        description: "We couldn't upload your file. Please check your connection and try again.",
        variant: "destructive",
    });
    throw new Error('Upload failed: No file ID returned from server');
}
