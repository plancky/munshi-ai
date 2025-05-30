import { TRANSCRIPTION_STATUS } from "./constants";

export type DataObject = {
    text: string;
    language: string;
    summary_gemini: string;
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

