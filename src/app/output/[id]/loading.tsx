import { TRANSCRIPTION_STATUS } from "@/shared/constants";
import LoadingUI from "./LoadingUI";

export default function Loading() {
    return <LoadingUI state={TRANSCRIPTION_STATUS.HOLD} />;
}
