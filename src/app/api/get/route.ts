import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const id = req.nextUrl.searchParams.get('id');

        if (typeof id == "undefined") {
            throw new Error("'id' is missing on the payload of get req.");
        }

        const resObject = await fetchTranscript(id!);

        const dataObject = resObject.data.data;
        if (typeof dataObject !== "undefined") {
            const { summary_gemini: summary, text } = dataObject;
            if (summary) {
                dataObject.summary_gemini = cleanSummaryHtmlString(summary);
            }
            if (text) {
                dataObject.paras = formatTranscriptInParagraphs(text, 200);
            }
        }

        return NextResponse.json(resObject, { status: 200 });
    } catch (e) {
        return NextResponse.json({ error: e }, { status: 400 });
    }
}

async function fetchTranscript(id: string) {
    const payload = JSON.stringify({
        vid: id,
    });

    const res = await fetch(process.env.MODAL_APP + "/fetch_data", {
        method: "POST",
        body: payload,
        headers: {
            "Content-Type": "application/json",
        },
        next: {
            revalidate: 5,
        },
    });
    return await res.json();
}

function formatTranscriptInParagraphs(text: string, wordLimit: number) {
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

function cleanSummaryHtmlString(html_str: string) {
    // const clean_html = html_str.replace("\`\`\`", "").replace("html", "");
    const match = /```html\n([\s\S]*?)```/g.exec(html_str);
    return match ? match[1] : html_str;
}
