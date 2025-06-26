import { Metadata } from "next";
import HeroSection from "@/components/HeroSection";

export const metadata: Metadata = {
    title: "Munshi | Home",
    description:
        "   An AI-powered assistant that transcribes and summarises audio so that you don't have to.",
};

export default function Home() {
    return (
        <>
            <div className="content-grid h-auto">
                <HeroSection />
            </div>
        </>
    );
}
