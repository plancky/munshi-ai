import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { Toaster } from "../components/ui/toaster";

const inter = Inter({
    weight: ["400", "500", "700"],
    style: ["normal"],
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
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
                className={`${inter.variable} font-primary antialiased`}
            >
                <div className="relative min-h-[100dvh]">
                    <Header />
                    <main>{children}</main>
                </div>
                <Toaster />
            </body>
        </html>
    );
}
