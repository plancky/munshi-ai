import Logo from "@/logo/logo.svg?inline";
import { SparkleIcon, MicrophoneIcon } from "@phosphor-icons/react/dist/ssr";

export default function Header() {
    return (
        <div className="full-width relative z-50">
            <header className="full-width fixed w-full py-4">
                <div className="flex items-center justify-between rounded-xl backdrop-blur-lg border border-white/20 shadow-lg px-4 py-3 transition-all duration-300 hover:bg-card/90">
                    <a href="/" className="flex items-center gap-3 group">
                        <span className="font-normal transition-transform duration-200 group-hover:scale-105">
                            <Logo className="h-8" />
                        </span>
                        <span className="hidden font-heading text-base font-medium text-foreground lg:block">
                            Munshi
                        </span>
                    </a>
                    
                    <div className="flex items-center gap-4">
                        {/* Quick Actions */}
                        <div className="flex items-center gap-2">
                            <a 
                                href="/ask" 
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                            >
                                <MicrophoneIcon className="w-4 h-4" />
                                <span className="hidden sm:block">Transcribe</span>
                            </a>
                            
                            <div className="w-px h-5 bg-border" />
                            
                            <div className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground bg-muted/50 rounded-md">
                                <SparkleIcon className="w-3 h-3" />
                                <span className="hidden sm:block">AI-powered</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        </div>
    );
}

