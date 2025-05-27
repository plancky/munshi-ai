import { promises as fs } from "fs";

export async function getInMemoryAudioFile(path: string, file_name: string) {
    const fileBuffer = await fs.readFile(process.cwd() + path);
    return new Blob([fileBuffer]);
}
