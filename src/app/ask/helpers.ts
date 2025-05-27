/*
Accept three kinds of urls
https://www.youtube.com/watch?v=<video_id>
https://youtube.com/shorts/<video_id>
https://youtu.be/<video_id> 
*/
export function extractVideoId(urlString: string) {
    try {
        const url = new URL(urlString.trim());
        const hostname = url.hostname;
        const pathname = url.pathname;
        const segments = pathname.split("/");
        const params = url.searchParams;
        const parts = segments;
        if (hostname == "youtu.be") {
            const vid = segments[1];
            return vid;
        } else if (["youtube.com", "www.youtube.com"].includes(hostname)) {
            if (segments[1] == "shorts") {
                return segments[2];
            } else if (segments[1] == "watch") {
                return params.get("v");
            } else {
                return null;
            }
        } else {
            return null;
        }
    } catch (error) {
        return null; // Handle invalid URLs
    }
}

export function getYTurl(vid: string) {
    return `https://www.youtube.com/watch?v=${vid}`;
}