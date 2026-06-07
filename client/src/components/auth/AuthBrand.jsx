import {Code2} from 'lucide-react';

export default function AuthBrand() {
    return (
        <div className="hidden lg:flex lg:w-[42%] bg-zinc-950 text-zinc-100 flex-col justify-between p-12 relative overflow-hidden border-r border-zinc-800">
            {/* Subtle background grid decoration */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage:
                        'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Glowing ambient blob */}
            <div className="absolute top-1/4 -left-1/4 w-[150%] h-[80%] rounded-full bg-gradient-to-tr from-primary/10 to-transparent blur-3xl pointer-events-none" />

            {/* Logo */}
            <div className="relative flex items-center gap-2.5 z-10">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15 border border-primary/20">
                    <Code2 className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xl font-bold tracking-tight text-foreground:dark font-serif">
                    CodeCode
                </span>
            </div>

            {/* Middle hero content */}
            <div className="relative z-10 space-y-8">
                <div className="space-y-3">
                    <h2 className="text-4xl font-bold font-serif leading-tight tracking-tight text-foreground:dark">
                        Code. Compete.
                        <br />
                        Conquer.
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                        Join thousands of competitive programmers sharpening
                        their skills every day.
                    </p>
                </div>

                {/* Decorative IDE-style code block */}
                <div className="rounded-xl bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-5 font-mono text-sm space-y-1.5 leading-relaxed shadow-lg">
                    <p className="text-zinc-500 text-xs mb-2">
                        // your journey starts here
                    </p>
                    <p className="text-zinc-400">
                        <span className="text-purple-400">int</span>{' '}
                        <span className="text-blue-400 font-semibold">rating</span> ={' '}
                        <span className="text-amber-500">1200</span>;
                    </p>
                    <p className="text-zinc-400">
                        <span className="text-purple-400">while</span> (
                        <span className="text-amber-500 font-semibold">true</span>
                        ) {'{'}
                    </p>
                    <p className="pl-5 text-zinc-400">
                        <span className="text-blue-400">solve</span>(
                        <span className="text-emerald-400 font-medium">problem</span>
                        <span className="text-purple-400">++</span>);
                    </p>
                    <p className="pl-5 text-zinc-400">
                        <span className="text-blue-400">rating</span>{' '}
                        <span className="text-purple-400">+=</span>{' '}
                        <span className="text-emerald-400 font-medium">delta</span>;
                    </p>
                    <p className="text-zinc-400">{'}'}</p>
                </div>
            </div>

            {/* Bottom branding footer */}
            <div className="relative z-10 text-[10px] text-zinc-600 font-semibold uppercase tracking-wider">
                &copy; {new Date().getFullYear()} CodeCode
            </div>
        </div>
    );
}
