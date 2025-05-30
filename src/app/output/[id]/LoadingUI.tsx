import { Skeleton } from "@/components/ui/skeleton";
import { TRANSCRIPTION_STATUS } from "@/shared/constants";

const LOADING_MESSAGES = {
    [TRANSCRIPTION_STATUS.INIT]: "Initiated transcript generation...",
    [TRANSCRIPTION_STATUS.FETCHING_AUDIO]: "Downloading Audio from Youtube...",
    [TRANSCRIPTION_STATUS.TRANSCRIBING]: "Munshi is transcribing the audio for you...",
    [TRANSCRIPTION_STATUS.SUMMARIZING]: "Transcription done! Summarizing...",
    [TRANSCRIPTION_STATUS.COMPLETED]: "Rendering... Just a few more seconds.",
};

export default function LoadingUI(props: { state: TRANSCRIPTION_STATUS }) {
    const message = LOADING_MESSAGES[props?.state];

    return (
        <div className="grid h-full place-items-center">
            <div className="flex w-full flex-col items-center gap-20">
                <div className="flex w-fit flex-col items-center gap-5 font-heading">
                    <h1 className="text-xl font-bold">Munshi</h1>
                    <h2 className="text-lg">{message}</h2>
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
            <div className="flex gap-2">
                <Skeleton className="h-8 flex-1 rounded-xl" />
                <Skeleton className="h-8 flex-1 rounded-xl" />
            </div>
            <div className="space-y-2">
                {new Array(8).fill(0).map((_x, _i) => (
                    <Skeleton key={"skeleton" + `${_i}`} className="h-4" />
                ))}
            </div>
        </div>
    );
}
