import { Skeleton } from "@/components/ui/skeleton";
import { TRANSCRIPTION_STATUS } from "@/shared/constants";

const LOADING_MESSAGES = {
    [TRANSCRIPTION_STATUS.HOLD]: "Contacting the server...",
    [TRANSCRIPTION_STATUS.INIT]: "Initiated transcript generation...",
    [TRANSCRIPTION_STATUS.FETCHING_AUDIO]: "Downloading Audio from Youtube...",
    [TRANSCRIPTION_STATUS.TRANSCRIBING]:
        "Munshi is transcribing the audio for you...",
    [TRANSCRIPTION_STATUS.SUMMARIZING]: "Transcription done! Summarizing...",
    [TRANSCRIPTION_STATUS.COMPLETED]: "Rendering... Just a few more seconds.",
};

export default function LoadingUI(props: { state: TRANSCRIPTION_STATUS }) {
    const message = LOADING_MESSAGES[props?.state];

    return (
        <div className="grid h-full place-items-center pb-20 pt-28 lg:pt-40">
            <div className="flex w-full flex-col items-center gap-20">
                <div className="flex w-fit flex-col items-center gap-5 font-heading">
                    <h2 className="text-center text-lg">{message}</h2>
                    <div className="lds-hourglass"></div>
                </div>
                <LoadingCard />
            </div>
        </div>
    );
}
function LoadingCard() {
    return (
        <div className="flex w-full flex-col space-y-3">
            <div className="grid grid-cols-2 grid-rows-2 gap-2">
                {new Array(4).fill(0).map((_x, _i) => (
                    <Skeleton key={_i} className="h-8 flex-1 rounded-xl" />
                ))}
            </div>
            <div className="space-y-2"></div>
        </div>
    );
}
