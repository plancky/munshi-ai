import Link from "next/link";
import { Button } from "../components/ui/button";
import { Home, Upload } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="w-full max-w-md space-y-8 text-center">
                {/* 404 Number */}
                <div className="space-y-4">
                    <h1 className="text-6xl font-bold tracking-tighter text-primary sm:text-7xl md:text-8xl">
                        404
                    </h1>
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
                            OH SNAP! 💥
                        </h2>
                        <p className="text-muted-foreground">
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
