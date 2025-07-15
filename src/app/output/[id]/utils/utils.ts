import { MODAL_URL } from "@/lib/url";

export async function updateSpeakerMappings(vid: string, speakerMappings: Record<string, string>) {
    try {
        const res = await fetch(`${MODAL_URL}/update_speakers`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
                vid, 
                speaker_mappings: speakerMappings 
            }),
        });
        
        if (!res.ok) {
            throw new Error(`Failed to update speakers: ${res.status}`);
        }
        
        const data = await res.json();
        
        // Let React Query handle refetching - no need for page reload
        return data;
    } catch (error) {
        console.error("Error updating speaker mappings:", error);
        throw error;
    }
}
