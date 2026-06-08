import {useState, useEffect, useRef} from 'react';
import {
    useParams,
    useNavigate,
    useOutletContext,
    useLocation,
} from 'react-router-dom';
import {toast} from 'sonner';
import {Send, Loader2, Code2, Upload, Play, Terminal, Clock} from 'lucide-react';
import {Button} from '@/components/ui/button';
import api from '@/lib/axios';
import Editor from '@monaco-editor/react';
import {useTheme} from '@/components/theme-provider';

const VALID_LANGUAGES = ['cpp', 'c', 'java', 'python', 'javascript'];
const PROBLEM_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const VERDICT_CONFIG = {
    accepted: { label: 'Accepted', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
    wrong_answer: { label: 'Wrong Answer', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-500', bar: 'bg-red-500' },
    time_limit_exceeded: { label: 'Time Limit Exceeded', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500', bar: 'bg-amber-500' },
    memory_limit_exceeded: { label: 'Memory Limit Exceeded', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', dot: 'bg-purple-500', bar: 'bg-purple-500' },
    runtime_error: { label: 'Runtime Error', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', dot: 'bg-rose-500', bar: 'bg-rose-500' },
    compilation_error: { label: 'Compilation Error', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500', bar: 'bg-amber-500' },
    success: { label: 'Execution Finished', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
};

export default function ContestSubmitTab() {
    const {id} = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const {problems} = useOutletContext();
    const preselectedProblem =
        location.state?.preselectedProblem ||
        location.state?.preselectProblem ||
        '';

    const [submitting, setSubmitting] = useState(false);
    const [runningSample, setRunningSample] = useState(false);
    const [runResult, setRunResult] = useState(null);
    const [runProgress, setRunProgress] = useState('');
    const pollingIntervalRef = useRef(null);
    const pollingTimeoutRef = useRef(null);

    const [form, setForm] = useState({
        problem_id: preselectedProblem,
        language: 'cpp',
        source_code: '',
    });

    const {theme} = useTheme();
    const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';

    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
        };
    }, []);

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result;
            if (typeof content === 'string') {
                const ext = file.name.split('.').pop()?.toLowerCase();
                let lang = '';
                if (ext === 'cpp' || ext === 'cc') lang = 'cpp';
                else if (ext === 'c') lang = 'c';
                else if (ext === 'py') lang = 'python';
                else if (ext === 'java') lang = 'java';
                else if (ext === 'js') lang = 'javascript';
                setForm(prev => ({
                    ...prev,
                    source_code: content,
                    ...(lang && VALID_LANGUAGES.includes(lang) ? { language: lang } : {}),
                }));
                toast.success(`Loaded ${file.name} successfully!`);
            }
        };
        reader.onerror = () => toast.error('Failed to read file.');
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.problem_id || !form.language || !form.source_code.trim()) {
            toast.error('Please fill in all fields.');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/submissions', {
                problem_id: form.problem_id,
                language: form.language,
                source_code: form.source_code,
            });
            toast.success('Code submitted successfully!');
            navigate(`/contest/${id}/submissions`, {
                state: {autoRefresh: true},
            });
        } catch (err) {
            toast.error(
                err?.response?.data?.message || 'Failed to submit code.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleRunSample = async () => {
        if (!form.problem_id || !form.language || !form.source_code.trim()) {
            toast.error('Please fill in all fields.');
            return;
        }
        setRunningSample(true);
        setRunProgress('Queuing sample run...');
        setRunResult(null);
        try {
            const response = await api.post('/submissions/run-sample', {
                problem_id: form.problem_id,
                language: form.language,
                source_code: form.source_code,
            });
            const { customInvocationId } = response.data.data;
            startPolling(customInvocationId);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to start sample run.');
            setRunningSample(false);
            setRunProgress('');
        }
    };

    const startPolling = (customInvocationId) => {
        let elapsedSeconds = 0;
        setRunProgress('Running code...');
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);

        pollingIntervalRef.current = setInterval(async () => {
            elapsedSeconds += 5;
            setRunProgress(`Running... ${elapsedSeconds}s`);
            try {
                const statusRes = await api.get(`/custom-invocation/status/${customInvocationId}`);
                const { status, data } = statusRes.data;
                if (status === 'completed') {
                    clearInterval(pollingIntervalRef.current);
                    clearTimeout(pollingTimeoutRef.current);
                    setRunResult(data);
                    setRunningSample(false);
                    setRunProgress('');
                    toast.success('Sample run finished!');
                }
            } catch (err) {
                clearInterval(pollingIntervalRef.current);
                clearTimeout(pollingTimeoutRef.current);
                setRunningSample(false);
                setRunProgress('');
                toast.error(err?.response?.data?.message || 'Sample run failed on server.');
            }
        }, 5000);

        pollingTimeoutRef.current = setTimeout(() => {
            clearInterval(pollingIntervalRef.current);
            setRunningSample(false);
            setRunProgress('');
            setRunResult({ verdict: 'timeout', error: "Server didn't respond within 2 minutes." });
            toast.error("Execution timed out.");
        }, 120000);
    };

    if (problems.length === 0) {
        return (
            <div className="text-center py-16 border border-dashed rounded-xl bg-card">
                <Code2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="font-semibold mb-1">No Problems Available</h3>
                <p className="text-sm text-muted-foreground">
                    You cannot submit code because there are no active problems.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-border bg-muted/20">
                <h2 className="text-lg font-serif font-semibold flex items-center gap-2">
                    <Send className="w-5 h-5 text-primary" />
                    Submit Code
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                    Select a problem, choose your language, and paste your
                    source code.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Problem
                        </label>
                        <select
                            value={form.problem_id}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    problem_id: e.target.value ? Number(e.target.value) : '',
                                })
                            }
                            className="w-full h-10 px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            required
                        >
                            <option value="" disabled>
                                Select a problem
                            </option>
                            {problems.map((prob, idx) => {
                                const letter = PROBLEM_LETTERS[idx] || idx + 1;
                                return (
                                    <option
                                        key={prob.problem_id}
                                        value={prob.problem_id}
                                    >
                                        {letter} - {prob.title}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Language
                        </label>
                        <select
                            value={form.language}
                            onChange={(e) =>
                                setForm({...form, language: e.target.value})
                            }
                            className="w-full h-10 px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary capitalize"
                            required
                        >
                            {VALID_LANGUAGES.map((lang) => (
                                <option key={lang} value={lang}>
                                    {lang === 'cpp' ? 'C++' : lang}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Source Code
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-md border border-border bg-secondary hover:bg-secondary/80 transition-colors text-[10px] text-muted-foreground uppercase tracking-widest">
                            <Upload className="w-3 h-3" />
                            <span>Choose File</span>
                            <input
                                type="file"
                                accept=".cpp,.cc,.c,.py,.java,.js"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={submitting}
                            />
                        </label>
                    </div>
                    <div className="rounded-md border border-border overflow-hidden bg-card" style={{ height: '400px' }}>
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
                                readOnly: submitting,
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

                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        disabled={runningSample || submitting}
                        onClick={handleRunSample}
                        className="gap-2 px-8 text-xs font-semibold uppercase tracking-wider"
                    >
                        {runningSample ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />{' '}
                                {runProgress || 'Running...'}
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" /> Run Code
                            </>
                        )}
                    </Button>
                    <Button
                        type="submit"
                        size="lg"
                        disabled={submitting || runningSample}
                        className="gap-2 px-8 text-xs font-semibold uppercase tracking-wider"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />{' '}
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" /> Submit
                            </>
                        )}
                    </Button>
                </div>
            </form>

            {/* Output Panel for Run Code */}
            {(runningSample || runResult) && (
                <div className="border-t border-border bg-card">
                    <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/40">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sample Output</span>
                        </div>
                        {runResult?.executionTimeMs !== undefined && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                                <Clock className="w-3 h-3" />
                                {runResult.executionTimeMs}ms
                            </span>
                        )}
                    </div>
                    
                    <div className="p-6">
                        {runningSample ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                                <p className="text-sm text-muted-foreground font-mono">{runProgress}</p>
                            </div>
                        ) : runResult ? (
                            <div className="space-y-4">
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border ${VERDICT_CONFIG[runResult.verdict]?.bg || 'bg-zinc-500/10'} ${VERDICT_CONFIG[runResult.verdict]?.border || 'border-zinc-500/20'}`}>
                                    <span className={`w-2 h-2 rounded-full ${VERDICT_CONFIG[runResult.verdict]?.dot || 'bg-zinc-500'}`} />
                                    <span className={`text-xs font-bold uppercase tracking-wider ${VERDICT_CONFIG[runResult.verdict]?.color || 'text-zinc-500'}`}>
                                        {VERDICT_CONFIG[runResult.verdict]?.label || runResult.verdict}
                                    </span>
                                </div>
                                
                                {runResult.compilationError ? (
                                    <div>
                                        <p className="text-xs font-semibold text-amber-500 uppercase tracking-widest mb-2">Compilation Error</p>
                                        <pre className="text-sm font-mono text-amber-600 dark:text-amber-400 bg-amber-400/5 border border-amber-400/10 p-4 rounded-lg overflow-auto max-h-[300px] whitespace-pre-wrap">
                                            {runResult.compilationError}
                                        </pre>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Standard Output</p>
                                        <pre className="text-sm font-mono text-foreground bg-muted/30 border border-border p-4 rounded-lg overflow-auto max-h-[300px] whitespace-pre-wrap">
                                            {runResult.output || 'No output'}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
