import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai, Exo_2 } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Backdrop from "@/components/backdrop.svg?inline";

const Exo2Font = Exo_2({
    weight: ["100", "300", "400", "700"],
    style: ["normal", "italic"],
    subsets: ["latin"],
    display: "swap",
    variable: "--font-heading",
});

const IBMPlexSans = IBM_Plex_Sans_Thai({
    weight: ["200", "400", "700"],
    style: ["normal"],
    subsets: ["latin"],
    display: "swap",
    variable: "--font-primary",
});

export const metadata: Metadata = {
    title: "Munshi",
    description: "Home page",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head />
            <body
                className={`${IBMPlexSans.variable} ${Exo2Font.variable} dark font-primary antialiased`}
            >
                <div
                    id="backdrop"
                    className="fixed -z-10 h-[100dvh] w-[100dvw] overflow-hidden opacity-15"
                >
                    <Backdrop />
                </div>
                <div className="content-grid relative z-0 min-h-[100dvh] grid-rows-[auto_1fr_auto]">
                    <Header />
                    <main>{children}</main>
                </div>
            </body>
        </html>
    );
}
