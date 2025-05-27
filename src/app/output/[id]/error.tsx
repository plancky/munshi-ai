"use client"; // Error boundaries must be Client Components

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="grid h-full place-items-center">
            <Card className="w-fit">
                <CardContent className="p-6 lg:p-20  lg:min-w-[500px]">
                    <div className="flex items-center flex-col gap-10">
                        <h2 className="text-3xl">Oops! Something went wrong!</h2>
                        <p className="text-xl">Looks like you made an invalid request</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

