import { toast } from "@/lib/hooks/use-toast";

/**
 * Upload a file to the server using streaming upload
 * @param file - The file to upload
 * @param metadata - File metadata (for compatibility, not sent to server)
 * @param uploadUrl - The server endpoint that accepts file uploads
 * @param progressCallback - Optional callback for upload progress updates
 */
export async function uploadFile(
    file: File,
    uploadUrl: string,
    progressCallback?: (progress: number) => void,
) {
    try {
        console.log('Starting upload:', { fileName: file.name, fileSize: file.size, fileType: file.type });
        
        // Create form data with the file and metadata
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", file.name);

        // Create XMLHttpRequest for progress tracking
        return new Promise<{ id: string; exists: boolean }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && progressCallback) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    progressCallback(percentComplete);
                }
            });

            // Handle upload completion
            xhr.addEventListener('load', () => {
                console.log('Upload completed, status:', xhr.status);
                console.log('Response:', xhr.responseText);
                
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        
                        if (data?.id) {
                            // Check if transcript already exists
                            if (data.status === "transcript_exists") {
                                toast({
                                    title: "Hey, we&apos;ve seen this before!",
                                    description: "This file was already transcribed.",
                                });
                                
                                // Redirect immediately to existing transcript
                                window.location.href = `/output/${data.id}`;
                                resolve({ id: data.id, exists: true });
                                return;
                            }
                            
                            // New upload completed successfully
                            resolve({ id: data.id, exists: false });
                        } else {
                            console.error('No ID in response:', data);
                            reject(new Error('Upload failed: No file ID returned from server'));
                        }
                    } catch (e) {
                        console.error('Failed to parse response:', xhr.responseText);
                        reject(new Error(`Failed to parse server response: ${e}`));
                    }
                } else {
                    console.error('Upload failed with status:', xhr.status, xhr.statusText);
                    console.error('Error response:', xhr.responseText);
                    reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
                }
            });

            // Handle upload errors
            xhr.addEventListener('error', () => {
                console.error('Upload network error');
                reject(new Error('Upload failed due to network error'));
            });

            // Handle upload abort
            xhr.addEventListener('abort', () => {
                console.log('Upload was cancelled');
                reject(new Error('Upload was cancelled'));
            });

            // Send the request
            console.log('Sending request to:', uploadUrl);
            xhr.open('POST', uploadUrl);
            // Note: Don't set Content-Type header manually - let browser set it for FormData
            xhr.send(formData);
        });

    } catch (error) {
        console.error('Upload preparation error:', error);
        toast({
            title: "Well, that&apos;s awkward",
            description: "Upload hit a snag. Check your connection and give it another shot?",
            variant: "destructive",
        });
        throw error;
    }
}

export async function generateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return `local_${hashHex.slice(0, 16)}`
}

export function formatFileSize(bytes: number): string {
    return (bytes / 1024 / 1024).toFixed(1)
}