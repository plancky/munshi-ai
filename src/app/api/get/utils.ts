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

export function cleanSummaryHtmlString(html_str: string) {
    const match = /```html\n([\s\S]*?)```/g.exec(html_str);
    return match ? match[1] : html_str;
}
