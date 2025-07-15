import Link from "next/link";
import { Button } from "../components/ui/button";
import { Home, Upload } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="w-full max-w-md space-y-8 text-center">
                {/* 404 Number */}
                <div className="space-y-6">
                    <h1 className="text-7xl font-bold tracking-tighter text-primary sm:text-8xl md:text-9xl">
                        404
                    </h1>
                    <div className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
                            OH SNAP! 💥
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Looks like you&apos;ve ventured into uncharted digital territory. 
                            Don&apos;t worry, even the best navigators get lost sometimes!
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button variant="default" asChild className="flex items-center gap-2 hover:animate-pulse">
                        <Link href="/" prefetch={false}>
                            <Home className="h-4 w-4" />
                            Go Home
                        </Link>
                    </Button>
                    
                    <Button variant="outline" asChild className="flex items-center gap-2 hover:animate-pulse">
                        <Link href="/ask" prefetch={false}>
                            <Upload className="h-4 w-4" />
                            Upload Audio
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
