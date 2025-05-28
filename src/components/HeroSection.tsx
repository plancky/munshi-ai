import Link from "next/link";
import { config } from "@/app/config";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/src/lib/utils";
import Logo from "@/logo/logo.svg?inline";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/ssr";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {}

export default function HeroSection({ ...props }: SectionProps) {
    return (
        <section {...props}>
            <div className="lg:gap-18 flex min-h-screen flex-col items-center justify-center gap-10">
                <div className="flex flex-col items-center gap-8 lg:gap-10">
                    <h1 className="text-center font-bold">
                        <div className="flex gap-5 lg:gap-6">
                            <div className="font-normal">
                                <Logo className="h-32 text-foreground" />
                                <span className="font-heading text-lg font-light">
                                    Munshi
                                </span>
                            </div>
                            <div className="hidden h-full flex-col lg:flex">
                                <span className="flex h-full flex-col items-start font-heading text-lg">
                                    <span className="">Your</span>
                                    <span>Personal A.I.</span>
                                    <span>Scribe</span>
                                </span>
                            </div>
                        </div>
                    </h1>
                    <p
                        className={cn(
                            "text-center font-heading text-subheading_sm font-light lg:text-subheading",
                            "max-w-xl",
                        )}
                    >
                        {`
                            An AI-powered assistant that transcribes and summarises media so that you don't have to!
                                `}
                    </p>
                </div>
                <div className="flex gap-5">
                    {/*
                        <Link
                            className={buttonVariants({
                                variant: "outline",
                            })}
                            href={"#about-us"}
                        >
                            {`
                            Munshi's mission
                            `}
                        </Link>
                        */}
                    <Link
                        prefetch
                        className={buttonVariants({
                            variant: "default",
                        })}
                        href={config.links["ask-munshi"].href}
                    >
                        <span className="flex gap-2">
                            {config.links["ask-munshi"].name}
                            {<ArrowSquareOutIcon size={16} />}
                        </span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
