import { OutputObject } from "@/shared/types";

export interface ModedOutputDataObject {
    text: string;
    language: string;
    summary_gemini: string;
    speaker_transcript?: string;
    speaker_mappings?: Record<string, string>;
}

export interface ModedOutputObject extends OutputObject {
    data: ModedOutputDataObject;
}
