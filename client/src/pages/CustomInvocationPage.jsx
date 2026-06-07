import {useState, useEffect, useRef} from 'react';
import {toast} from 'sonner';
import {Play, Loader2, Terminal, AlertTriangle, Cpu, Clock, CheckCircle2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import api from '@/lib/axios';

const VALID_LANGUAGES = ['cpp', 'c', 'java', 'python', 'javascript'];

export default function CustomInvocationPage() {
    const [form, setForm] = useState({
        language: 'cpp',
        source_code: '',
        input_data: '',
    });
    const [executing, setExecuting] = useState(false);
    const [progressStatus, setProgressStatus] = useState('');
    const [result, setResult] = useState(null);
    const pollingIntervalRef = useRef(null);
    const pollingTimeoutRef = useRef(null);

    // Clean up polling on unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
        };
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

        // Clear any existing pollers
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);

        pollingIntervalRef.current = setInterval(async () => {
            elapsedSeconds += 5;
            setProgressStatus(`Running code... (${elapsedSeconds}s)`);

            try {
                const statusRes = await api.get(`/custom-invocation/status/${customInvocationId}`);
                const {status, data} = statusRes.data;

                if (status === 'completed') {
                    // Stop polling
                    clearInterval(pollingIntervalRef.current);
                    clearTimeout(pollingTimeoutRef.current);
                    setResult(data);
                    setExecuting(false);
                    setProgressStatus('');
                    toast.success('Execution finished successfully!');
                }
            } catch (err) {
                // If not found or failed, check if it's a real api error or expired
                clearInterval(pollingIntervalRef.current);
                clearTimeout(pollingTimeoutRef.current);
                setExecuting(false);
                setProgressStatus('');
                toast.error(err?.response?.data?.message || 'Execution failed on server.');
            }
        }, 5000);

        // 2 minutes timeout (120000ms)
        pollingTimeoutRef.current = setTimeout(() => {
            clearInterval(pollingIntervalRef.current);
            setExecuting(false);
            setProgressStatus('');
            setResult({
                verdict: 'timeout',
                error: "Server didn't respond within 2 minutes.",
            });
            toast.error("Execution timed out. Server didn't respond.");
        }, 120000);
    };

    const getVerdictBadge = (verdict) => {
        switch (verdict) {
            case 'success':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Success
                    </span>
                );
            case 'compilation_error':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Compilation Error
                    </span>
                );
            case 'runtime_error':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Runtime Error
                    </span>
                );
            case 'time_limit_exceeded':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                        <Clock className="w-3.5 h-3.5" />
                        Time Limit Exceeded
                    </span>
                );
            case 'memory_limit_exceeded':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                        <Cpu className="w-3.5 h-3.5" />
                        Memory Limit Exceeded
                    </span>
                );
            case 'timeout':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Timeout
                    </span>
                );
            default:
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                        {verdict}
                    </span>
                );
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-5">
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
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Language:
                    </label>
                    <select
                        value={form.language}
                        onChange={(e) => setForm({...form, language: e.target.value})}
                        className="h-10 px-3 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary capitalize font-medium"
                        disabled={executing}
                    >
                        {VALID_LANGUAGES.map((lang) => (
                            <option key={lang} value={lang}>
                                {lang === 'cpp' ? 'C++' : lang}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Code input form */}
                <form onSubmit={handleRun} className="lg:col-span-2 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Source Code
                            </label>
                            <span className="text-[10px] text-muted-foreground font-mono">
                                max execution time: 10s | memory limit: 512MB
                            </span>
                        </div>
                        <textarea
                            value={form.source_code}
                            onChange={(e) => setForm({...form, source_code: e.target.value})}
                            className="w-full h-[460px] resize-none p-4 text-sm font-mono rounded-xl border border-border bg-muted/10 shadow-inner focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:bg-background transition-all"
                            placeholder="// Paste your program source code here..."
                            spellCheck="false"
                            disabled={executing}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Standard Input (stdin)
                        </label>
                        <textarea
                            value={form.input_data}
                            onChange={(e) => setForm({...form, input_data: e.target.value})}
                            className="w-full h-[120px] resize-none p-3 text-sm font-mono rounded-xl border border-border bg-muted/10 shadow-inner focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:bg-background transition-all"
                            placeholder="// Provide input data for program execution..."
                            spellCheck="false"
                            disabled={executing}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            size="lg"
                            disabled={executing}
                            className="gap-2 px-8 text-xs font-bold uppercase tracking-wider shadow-md"
                        >
                            {executing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {progressStatus}
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 fill-current" /> Run Code
                                </>
                            )}
                        </Button>
                    </div>
                </form>

                {/* Output Panel */}
                <div className="lg:col-span-1 flex flex-col">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Execution Output
                    </h3>

                    <div className="bg-card border border-border rounded-xl p-5 flex flex-col shadow-sm h-[685px]">
                        {executing && (
                            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-3">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                <p className="text-sm font-medium text-foreground">{progressStatus}</p>
                                <p className="text-xs text-muted-foreground max-w-xs">
                                    Your execution job is being processed in a priority queue.
                                </p>
                            </div>
                        )}

                        {!executing && !result && (
                            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                                <Terminal className="w-12 h-12 text-muted-foreground/30 mb-3" />
                                <p className="text-sm font-medium">No execution results yet</p>
                                <p className="text-xs max-w-xs mt-1">
                                    Write some code, supply standard input data, and click "Run Code" to view output.
                                </p>
                            </div>
                        )}

                        {!executing && result && (
                            <div className="flex flex-col min-h-0 space-y-4">
                                {/* Verdict & Details Header */}
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                                    {getVerdictBadge(result.verdict)}

                                    {result.executionTimeMs !== undefined && (
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                                            <Clock className="w-3.5 h-3.5" />
                                            {result.executionTimeMs}ms
                                        </span>
                                    )}
                                </div>

                                {/* Output Area */}
                                <div className="flex flex-col min-h-0 space-y-3">
                                    {result.compilationError ? (
                                        <div className="flex flex-col min-h-0 space-y-2">
                                            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wide">
                                                Compilation Error:
                                            </h4>
                                            <pre className="h-[480px] p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg text-xs font-mono overflow-auto whitespace-pre-wrap text-amber-600 dark:text-amber-400">
                                                {result.compilationError}
                                            </pre>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col min-h-0 space-y-2">
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                                Standard Output (stdout):
                                            </h4>
                                            <pre className="h-[480px] p-3 bg-muted/30 border border-border rounded-lg text-xs font-mono overflow-auto whitespace-pre-wrap text-foreground">
                                                {result.output || (
                                                    <span className="italic text-muted-foreground/60">
                                                        (No output generated)
                                                    </span>
                                                )}
                                            </pre>
                                        </div>
                                    )}

                                    {/* General Error (Timeout, queue failure) */}
                                    {result.error && (
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-red-500 uppercase tracking-wide">
                                                Error Message:
                                            </h4>
                                            <p className="text-sm font-mono text-red-500">{result.error}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
