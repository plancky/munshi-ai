import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Loader2, Pause, Play } from "lucide-react";
import { clsx } from "clsx";

type Props = {
    file: File;
};

type TrackMetadata = {
    duration: number;
    name: string;
    size: number;
};

const Waveform = ({ file }: Props) => {
    const waveform = useRef<HTMLDivElement | null>(null);
    const track = useRef<WaveSurfer | null>(null);
    const [mounted, setMounted] = useState(false);
    const [metadata, setMetadata] = useState<TrackMetadata>({
        duration: 0,
        name: "",
        size: 0,
    });
    const [currentTime, setCurrentTime] = useState(0);
    const [play, setPlay] = useState(false);

    useEffect(() => {
        if (waveform.current) {
            track.current = WaveSurfer.create({
                container: waveform.current,
                waveColor: "hsl(210 40% 98%)",
                progressColor: "hsl(220 70% 50%)",
                url: URL.createObjectURL(file),
                barGap: 1,
                barWidth: 3,
                barRadius: 3,
                cursorColor: "hsl(160 60% 45%)",
                cursorWidth: 2,
            });
            track.current.on("ready", () => {
                setMounted(true);
                setMetadata((metadata) => {
                    metadata.duration = track.current?.getDuration() || 0;
                    metadata.name = file.name;
                    metadata.size = file.size;
                    return metadata;
                });
            });

            track.current?.on("play", () => {
                setPlay(true);
            });

            track.current?.on("pause", () => {
                setPlay(false);
            });

            track.current.on("finish", () => {
                setPlay(false);
            });

            return () => {
                if (track.current) {
                    track.current.destroy();
                    setMounted(false);
                }
            };
        }
    }, [file]);

    useEffect(() => {
        if (track.current) {
            track.current.on("interaction", () => {
                setCurrentTime(track.current?.getCurrentTime() || 0);
            });
        }
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (track.current && track.current.isPlaying()) {
                setCurrentTime(track.current.getCurrentTime());
            }
        }, 100);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <>
            <div className="flex h-48 justify-center">
                <div
                    className={clsx(
                        "flex h-36 w-full items-center justify-center rounded-lg bg-transparent",
                        !mounted ? "block" : "hidden",
                    )}
                >
                    <div className="m-auto animate-spin items-center">
                        <Loader2 opacity={0.5} size={30} />
                    </div>
                </div>
                <div
                    className={clsx(
                        "flex w-full flex-col gap-2 text-gray-600",
                        mounted ? "block" : "hidden",
                    )}
                >
                    <div className="flex w-full justify-between gap-24 font-mono text-sm tracking-tight text-opacity-70">
                        <div className="w-fit overflow-hidden text-ellipsis whitespace-nowrap">
                            {file.name}
                        </div>
                        <div className="w-fit whitespace-nowrap">
                            {(metadata.size / 1000).toFixed(2)} kb
                        </div>
                    </div>
                    <div className="w-full" ref={waveform} id="waveform"></div>
                    <div className="flex items-center justify-between font-mono text-sm tracking-tight text-opacity-70">
                        <div className="w-2/5 text-left tabular-nums">
                            {currentTime.toFixed(2)}s
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                track.current?.playPause();
                            }}
                        >
                            {play ? (
                                <Pause fill="black" size={15} />
                            ) : (
                                <Play fill="black" size={15} />
                            )}
                        </button>
                        <div className="w-2/5 text-right tabular-nums">
                            {metadata.duration.toFixed(2)}s
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Waveform;
