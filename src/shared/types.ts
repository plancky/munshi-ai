import { TRANSCRIPTION_STATUS } from "./constants";

export type DataObject = {
    text: string;
    language: string;
    summary_gemini: string;
    speaker_transcript?: string;  // Speaker-aligned transcript
    speaker_mappings?: Record<string, string>;  // Map speaker IDs to custom names
};

export type MetadataObject = {
    title: string[];
    author: string[];
};

export type OutputObject = {
    status: TRANSCRIPTION_STATUS;
    data: DataObject;
    metadata: MetadataObject;
};

