import {useState, useEffect} from 'react';
import {Code2, Github, Twitter, Heart, Clock, Star} from 'lucide-react';
import api from '@/lib/axios';

export default function Footer() {
    const [serverTime, setServerTime] = useState(null);

    useEffect(() => {
        let interval;
        api.get('/')
            .then((res) => {
                if (res.data?.data?.serverTime) {
                    let currentTime = new Date(res.data.data.serverTime).getTime();
                    setServerTime(new Date(currentTime));
                    
                    interval = setInterval(() => {
                        currentTime += 1000;
                        setServerTime(new Date(currentTime));
                    }, 1000);
                }
            })
            .catch(() => {});

        return () => {
            if (interval) clearInterval(interval);
        };
    }, []);

    return (
        <footer className="border-t border-border bg-card">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    {/* Left Section: Brand & Copyright */}
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                                <Code2 className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-lg font-black text-foreground tracking-tight">
                                CodeCode
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                            © {new Date().getFullYear()} CodeCode. All rights reserved.
                        </p>
                    </div>

                    {/* Middle Section: Made with Love */}
                    <div className="flex flex-col items-center justify-center gap-2">
                        <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                            Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by
                            <a 
                                href="https://pranaw-kumar-portfolio.vercel.app" 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-foreground hover:text-primary transition-colors font-bold"
                            >
                                prana-W
                            </a>
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            {serverTime ? (
                                <span className="tabular-nums">Server Time: {serverTime.toLocaleTimeString()}</span>
                            ) : (
                                <span>Connecting...</span>
                            )}
                        </div>
                    </div>

                    {/* Right Section: Socials */}
                    <div className="flex items-center justify-center md:justify-end gap-3">
                        <a
                            href="https://github.com/prana-W/CodeCode"
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all duration-300"
                        >
                            <Star className="w-4 h-4 text-muted-foreground group-hover:text-yellow-500 group-hover:fill-yellow-500 transition-colors" />
                            <span className="text-sm font-semibold text-foreground">Star now on GitHub</span>
                        </a>
                        <a
                            href="https://github.com/prana-W"
                            target="_blank"
                            rel="noreferrer"
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all duration-300"
                            aria-label="GitHub"
                        >
                            <Github className="w-5 h-5" />
                        </a>
                        <a
                            href="https://x.com/prana_w"
                            target="_blank"
                            rel="noreferrer"
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] text-muted-foreground transition-all duration-300"
                            aria-label="Twitter"
                        >
                            <Twitter className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
