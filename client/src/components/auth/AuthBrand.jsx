import {Code2} from 'lucide-react';

/**
 * Shared decorative left panel shown on Login and Register pages.
 * All colours reference CSS variables so the palette is reskinnable from index.css.
 */
export default function AuthBrand() {
    return (
        <div className="hidden lg:flex lg:w-[42%] bg-primary text-primary-foreground flex-col justify-between p-12 relative overflow-hidden">
            {/* Subtle background grid decoration */}
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage:
                        'linear-gradient(var(--primary-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--primary-foreground) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Logo */}
            <div className="relative flex items-center gap-2.5 z-10">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-foreground/15 border border-primary-foreground/20">
                    <Code2 className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold tracking-tight">
                    CodeCode
                </span>
            </div>

            {/* Middle hero content */}
            <div className="relative z-10 space-y-7">
                <div className="space-y-3">
                    <h2 className="text-4xl font-bold leading-tight tracking-tight">
                        Code. Compete.
                        <br />
                        Conquer.
                    </h2>
                    <p className="text-primary-foreground/65 text-base leading-relaxed max-w-xs">
                        Join thousands of competitive programmers sharpening
                        their skills every day.
                    </p>
                </div>

                {/* Decorative pseudo-code block */}
                <div className="rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 p-5 font-mono text-sm space-y-1.5 leading-relaxed">
                    <p className="text-primary-foreground/40 text-xs mb-2">
                        // your journey starts here
                    </p>
                    <p>
                        <span className="text-primary-foreground/55">int</span>{' '}
                        <span className="text-primary-foreground font-semibold">
                            rating
                        </span>{' '}
                        <span className="text-primary-foreground/55">=</span>{' '}
                        <span className="text-primary-foreground/70">1200</span>
                        ;
                    </p>
                    <p>
                        <span className="text-primary-foreground/55">
                            while
                        </span>
                        (
                        <span className="text-primary-foreground font-semibold">
                            true
                        </span>
                        ) {'{'}
                    </p>
                    <p className="pl-5">
                        <span className="text-primary-foreground font-semibold">
                            solve
                        </span>
                        (
                        <span className="text-primary-foreground/70">
                            problem
                        </span>
                        <span className="text-primary-foreground/55">++</span>);
                    </p>
                    <p className="pl-5">
                        <span className="text-primary-foreground">rating</span>{' '}
                        <span className="text-primary-foreground/55">+=</span>{' '}
                        <span className="text-primary-foreground/70">
                            delta
                        </span>
                        ;
                    </p>
                    <p>{'}'}</p>
                </div>
            </div>

            {/* Stats row */}
            <div className="relative z-10 flex gap-10 pt-4 border-t border-primary-foreground/15">
                {[
                    {value: '10K+', label: 'Coders'},
                    {value: '500+', label: 'Problems'},
                    {value: '200+', label: 'Contests'},
                ].map(({value, label}) => (
                    <div key={label}>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-primary-foreground/55 text-sm mt-0.5">
                            {label}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
