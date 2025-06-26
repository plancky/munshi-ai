import { Metadata } from "next";
import { AskMunishiSection } from "./components/AskMunshiSection";

export const metadata: Metadata = {
    title: "Munshi - Ask",
    description:
        "   An AI-powered assistant that transcribes and summarises audio so that you don't have to.",
};

export default function Home() {
    return (
        <>
            <div className="content-grid">
                <div className="h-full w-full full-width-gridless flex-1">
                    <AskMunishiSection />
                </div>
            </div>
        </>
    );
}
