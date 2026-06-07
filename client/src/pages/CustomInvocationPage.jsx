import {useState, useEffect, useRef} from 'react';
import {toast} from 'sonner';
import {Play, Loader2, Terminal, AlertTriangle, Cpu, Clock, CheckCircle2, ChevronDown} from 'lucide-react';
import api from '@/lib/axios';
import Editor from '@monaco-editor/react';
import {useTheme} from '@/components/theme-provider';

const VALID_LANGUAGES = ['cpp', 'c', 'java', 'python', 'javascript'];

const LANG_LABEL = {
    cpp: 'C++',
    c: 'C',
    java: 'Java',
    python: 'Python',
    javascript: 'JavaScript',
};

const VERDICT_CONFIG = {
    success: {
        label: 'Success',
        icon: CheckCircle2,
        bar: 'bg-emerald-400',
        text: 'text-emerald-400',
        bg: 'bg-emerald-400/10',
        border: 'border-emerald-400/25',
        dot: 'bg-emerald-400',
    },
    compilation_error: {
        label: 'Compilation Error',
        icon: AlertTriangle,
        bar: 'bg-amber-400',
        text: 'text-amber-400',
        bg: 'bg-amber-400/10',
        border: 'border-amber-400/25',
        dot: 'bg-amber-400',
    },
    runtime_error: {
        label: 'Runtime Error',
        icon: AlertTriangle,
        bar: 'bg-red-400',
        text: 'text-red-400',
        bg: 'bg-red-400/10',
        border: 'border-red-400/25',
        dot: 'bg-red-400',
    },
    time_limit_exceeded: {
        label: 'Time Limit Exceeded',
        icon: Clock,
        bar: 'bg-orange-400',
        text: 'text-orange-400',
        bg: 'bg-orange-400/10',
        border: 'border-orange-400/25',
        dot: 'bg-orange-400',
    },
    memory_limit_exceeded: {
        label: 'Memory Limit Exceeded',
        icon: Cpu,
        bar: 'bg-purple-400',
        text: 'text-purple-400',
        bg: 'bg-purple-400/10',
        border: 'border-purple-400/25',
        dot: 'bg-purple-400',
    },
    timeout: {
        label: 'Timed Out',
        icon: AlertTriangle,
        bar: 'bg-zinc-500',
        text: 'text-zinc-400',
        bg: 'bg-zinc-500/10',
        border: 'border-zinc-500/25',
        dot: 'bg-zinc-500',
    },
};

function VerdictBadge({verdict}) {
    const cfg = VERDICT_CONFIG[verdict] ?? {
        label: verdict,
        icon: Terminal,
        text: 'text-zinc-400',
        bg: 'bg-zinc-500/10',
        border: 'border-zinc-500/25',
        dot: 'bg-zinc-500',
    };
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-widest ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

function StatusBar({verdict}) {
    const cfg = VERDICT_CONFIG[verdict];
    if (!cfg) return null;
    return <div className={`h-0.5 w-full ${cfg.bar} rounded-full mb-4 opacity-80`} />;
}

export default function CustomInvocationPage() {
    const [form, setForm] = useState({language: 'cpp', source_code: '', input_data: ''});
    const [executing, setExecuting] = useState(false);
    const [progressStatus, setProgressStatus] = useState('');
    const [result, setResult] = useState(null);
    const [langOpen, setLangOpen] = useState(false);
    const pollingIntervalRef = useRef(null);
    const pollingTimeoutRef = useRef(null);
    const langRef = useRef(null);
    const stdinTextareaRef = useRef(null);
    const stdinGutterRef = useRef(null);

    const {theme} = useTheme();
    const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';

    const handleStdinScroll = (e) => {
        if (stdinGutterRef.current) {
            stdinGutterRef.current.scrollTop = e.target.scrollTop;
        }
    };

    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
        };
    }, []);

    // Close language dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleRun = async (e) => {
        e.preventDefault();
        if (!form.source_code.trim()) {
            toast.error('Please enter some source code.');
            return;
        }
        setExecuting(true);
        setProgressStatus('Queuing execution job...');
        setResult(null);
        try {
            const response = await api.post('/custom-invocation', {
                source_code: form.source_code,
                language: form.language,
                input_data: form.input_data,
            });
            const {customInvocationId} = response.data;
            startPolling(customInvocationId);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to start execution.');
            setExecuting(false);
            setProgressStatus('');
        }
    };

    const startPolling = (customInvocationId) => {
        let elapsedSeconds = 0;
        setProgressStatus('Running code...');
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);

        pollingIntervalRef.current = setInterval(async () => {
            elapsedSeconds += 5;
            setProgressStatus(`Running... ${elapsedSeconds}s`);
            try {
                const statusRes = await api.get(`/custom-invocation/status/${customInvocationId}`);
                const {status, data} = statusRes.data;
                if (status === 'completed') {
                    clearInterval(pollingIntervalRef.current);
                    clearTimeout(pollingTimeoutRef.current);
                    setResult(data);
                    setExecuting(false);
                    setProgressStatus('');
                    toast.success('Execution finished!');
                }
            } catch (err) {
                clearInterval(pollingIntervalRef.current);
                clearTimeout(pollingTimeoutRef.current);
                setExecuting(false);
                setProgressStatus('');
                toast.error(err?.response?.data?.message || 'Execution failed on server.');
            }
        }, 5000);

        pollingTimeoutRef.current = setTimeout(() => {
            clearInterval(pollingIntervalRef.current);
            setExecuting(false);
            setProgressStatus('');
            setResult({verdict: 'timeout', error: "Server didn't respond within 2 minutes."});
            toast.error("Execution timed out.");
        }, 120000);
    };

    return (
        <div className="min-h-screen w-full bg-background text-foreground relative">


            <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-8">

                {/* Clean Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-5 mb-8">
                    <div>
                        <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground flex items-center gap-2.5">
                            <Terminal className="w-7 h-7 text-primary" />
                            Custom Invocation
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1.5">
                            Compile and execute code snippets on-the-fly with custom standard input (stdin).
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Language:
                        </span>
                        {/* Language Selector Dropdown */}
                        <div className="relative" ref={langRef}>
                            <button
                                type="button"
                                onClick={() => !executing && setLangOpen((o) => !o)}
                                disabled={executing}
                                className="flex items-center gap-3 px-4 py-2 rounded-lg border border-border bg-secondary text-secondary-foreground text-xs uppercase tracking-widest hover:bg-secondary/80 hover:text-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed min-w-[140px] justify-between"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    {LANG_LABEL[form.language]}
                                </span>
                                <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {langOpen && (
                                <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-lg border border-border bg-popover shadow-2xl overflow-hidden">
                                    {VALID_LANGUAGES.map((lang) => (
                                        <button
                                            key={lang}
                                            type="button"
                                            onClick={() => {
                                                setForm((f) => ({...f, language: lang}));
                                                setLangOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-xs uppercase tracking-widest flex items-center gap-2 transition-colors
                                                ${form.language === lang
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                                }`}
                                        >
                                            {form.language === lang && <span className="w-1 h-1 rounded-full bg-primary" />}
                                            {LANG_LABEL[lang]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Main Layout: fixed table-like structure to prevent layout shift ── */}
                <div className="flex gap-5" style={{alignItems: 'flex-start'}}>

                    {/* ── Left Panel: Code + Input ── */}
                    <div className="flex-none" style={{width: '60%', minWidth: 0}}>
                        <form onSubmit={handleRun} className="flex flex-col gap-4">

                            {/* Source Code */}
                            <div className="rounded-xl border border-border overflow-hidden bg-card">
                                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                            source_code.{form.language === 'cpp' ? 'cpp' : form.language === 'javascript' ? 'js' : form.language}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground/60 font-mono">
                                        {form.source_code.split('\n').length} lines
                                    </span>
                                </div>
                                <div className="relative border-t border-border" style={{ height: '420px' }}>
                                    <Editor
                                        height="100%"
                                        language={form.language === 'cpp' ? 'cpp' : form.language === 'javascript' ? 'javascript' : form.language === 'python' ? 'python' : form.language === 'java' ? 'java' : 'c'}
                                        theme={editorTheme}
                                        value={form.source_code}
                                        onChange={(val) => setForm({...form, source_code: val || ''})}
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            lineNumbers: 'on',
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                            readOnly: executing,
                                            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                                        }}
                                        loading={
                                            <div className="h-full w-full flex items-center justify-center bg-card text-muted-foreground text-xs font-mono">
                                                Loading Editor...
                                            </div>
                                        }
                                    />
                                </div>
                            </div>

                            {/* Stdin */}
                            <div className="rounded-xl border border-border overflow-hidden bg-card">
                                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/40">
                                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                        stdin
                                    </span>
                                </div>
                                <div className="flex relative bg-transparent" style={{ height: '110px' }}>
                                    {/* Gutter */}
                                    <div
                                        ref={stdinGutterRef}
                                        className="flex-none w-12 select-none border-r border-border/30 text-right pr-3 text-muted-foreground/35 font-mono text-sm leading-relaxed overflow-hidden py-4 bg-muted/10"
                                        style={{ height: '100%' }}
                                    >
                                        {Array.from({ length: Math.max(form.input_data.split('\n').length, 1) }, (_, i) => (
                                            <div key={i}>{i + 1}</div>
                                        ))}
                                    </div>
                                    <textarea
                                        ref={stdinTextareaRef}
                                        value={form.input_data}
                                        onChange={(e) => setForm({...form, input_data: e.target.value})}
                                        onScroll={handleStdinScroll}
                                        className="flex-1 resize-none py-4 pl-4 pr-5 text-sm font-mono bg-transparent text-foreground placeholder-muted-foreground/40 focus:outline-none leading-relaxed h-full overflow-y-auto"
                                        style={{ caretColor: 'var(--primary)' }}
                                        placeholder={"// Provide standard input data for the program..."}
                                        spellCheck="false"
                                        disabled={executing}
                                    />
                                </div>
                            </div>

                            {/* Run Button */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={executing}
                                    className="group relative flex items-center gap-2.5 px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-widest overflow-hidden transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20"
                                >
                                    {executing ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>{progressStatus || 'Running...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-3.5 h-3.5 fill-current" />
                                            <span>Execute</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* ── Right Panel: Output ── */}
                    <div className="flex-none" style={{width: 'calc(40% - 20px)', minWidth: 0}}>
                        <div
                            className="rounded-xl border border-border bg-card overflow-hidden"
                            style={{height: '600px', display: 'flex', flexDirection: 'column'}}
                        >
                            {/* Output Header */}
                            <div className="flex-none flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
                                <div className="flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full transition-colors ${executing ? 'bg-yellow-400 animate-pulse' : result ? (VERDICT_CONFIG[result?.verdict]?.dot ?? 'bg-zinc-500') : 'bg-zinc-600'}`} />
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                        stdout
                                    </span>
                                </div>
                                {result?.executionTimeMs !== undefined && (
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                                        <Clock className="w-3 h-3" />
                                        {result.executionTimeMs}ms
                                    </span>
                                )}
                            </div>

                            {/* Verdict status bar */}
                            {!executing && result?.verdict && (
                                <div className={`flex-none h-0.5 ${VERDICT_CONFIG[result.verdict]?.bar ?? 'bg-zinc-500'}`} />
                            )}

                            {/* Output Body */}
                            <div className="flex-1 overflow-hidden flex flex-col">

                                {/* Executing state */}
                                {executing && (
                                    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center">
                                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                            </div>
                                            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-foreground font-mono mb-1">{progressStatus}</p>
                                            <p className="text-[10px] text-muted-foreground">Processing in execution queue</p>
                                        </div>
                                        {/* Fake progress dots */}
                                        <div className="flex gap-1.5">
                                            {[0, 1, 2].map((i) => (
                                                <div
                                                    key={i}
                                                    className="w-1 h-1 rounded-full bg-primary/40 animate-bounce"
                                                    style={{animationDelay: `${i * 0.15}s`}}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Empty state */}
                                {!executing && !result && (
                                    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                                        <Terminal className="w-10 h-10 text-muted-foreground/40" />
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Awaiting execution</p>
                                            <p className="text-[10px] text-muted-foreground/60 max-w-[200px] leading-relaxed">
                                                Write your code, supply stdin, and hit Execute
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Result state */}
                                {!executing && result && (
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        {/* Verdict row */}
                                        <div className="flex-none px-4 py-3 border-b border-border/60">
                                            <VerdictBadge verdict={result.verdict} />
                                        </div>

                                        {/* Output content */}
                                        <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
                                            {result.compilationError ? (
                                                <div className="flex flex-col gap-2 h-full">
                                                    <span className="text-[10px] text-amber-500 uppercase tracking-widest font-mono">
                                                        Compilation Error
                                                    </span>
                                                    <pre
                                                        className="flex-1 text-sm font-mono text-amber-600 dark:text-amber-400 whitespace-pre-wrap break-words leading-relaxed p-3 rounded-lg bg-amber-400/5 border border-amber-400/10 overflow-auto"
                                                        style={{minHeight: 0}}
                                                    >
                                                        {result.compilationError}
                                                    </pre>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2 h-full">
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                                                        Standard Output
                                                    </span>
                                                    <pre
                                                        className="flex-1 text-sm font-mono text-foreground whitespace-pre-wrap break-words leading-relaxed p-3 rounded-lg bg-muted/30 border border-border overflow-auto shadow-inner"
                                                        style={{minHeight: 0}}
                                                    >
                                                        {result.output || (
                                                            <span className="italic text-muted-foreground">
                                                                (no output)
                                                            </span>
                                                        )}
                                                    </pre>
                                                </div>
                                            )}

                                            {result.error && (
                                                <div className="flex-none border-t border-border pt-3 mt-auto">
                                                    <span className="text-[10px] text-red-400 uppercase tracking-widest block mb-1">
                                                        Error
                                                    </span>
                                                    <p className="text-xs text-red-400/80 font-mono">{result.error}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
