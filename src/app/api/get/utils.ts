export function formatTranscriptInParagraphs(text: string, wordLimit: number) {
    const sentences = text.split(".");

    const paras: string[] = [];
    var curr_para = "";

    sentences.forEach((sentence, _i) => {
        const words_in_sentence = sentence.split(" ").length;

        if (
            words_in_sentence + curr_para.split(" ").length > wordLimit ||
            _i == sentences.length - 1
        ) {
            paras.push(curr_para);
            curr_para = "";
        }
        curr_para = curr_para + sentence + ".";
    });

    return paras;
}

export function formatSpeakerTranscriptInParagraphs(text: string, wordLimit: number) {
    // Split by speaker changes, not sentences, to preserve speaker continuity
    const lines = text.split('\n').filter(line => line.trim());
    const paras: string[] = [];
    let curr_para = "";
    let current_speaker = "";

    for (const line of lines) {
        const speakerMatch = line.match(/^([^:]+?):\s*(.*)$/);
        
        if (speakerMatch) {
            const [, speaker, speech] = speakerMatch;
            const trimmedSpeaker = speaker.trim();
            
            // If speaker changed, always start new paragraph
            if (trimmedSpeaker !== current_speaker) {
                // New speaker - flush current paragraph
                if (curr_para.trim()) {
                    paras.push(curr_para.trim());
                }
                curr_para = line;
                current_speaker = trimmedSpeaker;
            } else {
                // Same speaker - check if we need to split
                const currentWords = curr_para.split(" ").length;
                const newWords = speech.split(" ").length;
                
                if (currentWords + newWords > wordLimit) {
                    // Word limit exceeded - split long segments
                    if (curr_para.trim()) {
                        paras.push(curr_para.trim());
                    }
                    curr_para = line;
                } else {
                    // Same speaker, append to current paragraph
                    curr_para += "\n" + line;
                }
            }
        } else {
            // No speaker pattern, append to current paragraph if not too long
            const currentWords = curr_para.split(" ").length;
            const lineWords = line.split(" ").length;
            
            if (currentWords + lineWords > wordLimit && curr_para.trim()) {
                // Start new paragraph if too long
                paras.push(curr_para.trim());
                curr_para = line;
            } else {
                curr_para += "\n" + line;
            }
        }
    }

    // Add final paragraph
    if (curr_para.trim()) {
        paras.push(curr_para.trim());
    }

    return paras.filter(para => para.length > 0);
}

export function cleanSummaryHtmlString(html_str: string) {
    const match = /```html\n([\s\S]*?)```/g.exec(html_str);
    return match ? match[1] : html_str;
}
