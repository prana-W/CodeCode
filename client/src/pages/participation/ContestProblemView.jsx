import {useState, useEffect, useRef} from 'react';
import {Link, useParams, useNavigate, useOutletContext} from 'react-router-dom';
import {toast} from 'sonner';
import {
    Code,
    Clock,
    Database,
    ChevronLeft,
    Loader2,
    Play,
    Send,
    Terminal,
    ChevronUp,
    ChevronDown,
    GripVertical,
    GripHorizontal,
    Code2,
    FileCode2,
    ListChecks,
    CheckCircle2,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import api from '@/lib/axios';
import MDEditor from '@uiw/react-md-editor';
import Editor from '@monaco-editor/react';
import {useTheme} from '@/components/theme-provider';
import {getVerdictDetails} from '@/constants/verdicts';
import {HelpContent} from '@/components/HelpPanel';
import {useSocket} from '@/context/SocketContext';

const VALID_LANGUAGES = ['cpp', 'c', 'java', 'python', 'javascript'];
const LANG_LABEL = {
    cpp: 'C++',
    c: 'C',
    java: 'Java',
    python: 'Python',
    javascript: 'JavaScript',
};

export default function ContestProblemView() {
    const {id, problemId} = useParams();
    const navigate = useNavigate();
    const {contest, problems, solvedIds, setSolvedIds} = useOutletContext();
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const {socket} = useSocket();

    // UI Split Pane states
    const [leftWidth, setLeftWidth] = useState(50);
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [panelHeight, setPanelHeight] = useState(250);
    const [activeTab, setActiveTab] = useState('testcase'); // 'testcase' or 'result'
    const [isResizing, setIsResizing] = useState(false);

    // Editor states
    const [sourceCode, setSourceCode] = useState('');
    const [language, setLanguage] = useState('cpp');
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('none');
    const {theme} = useTheme();
    const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';
    const editorRef = useRef(null);

    // Execution states
    const [customInput, setCustomInput] = useState('');
    const [outputData, setOutputData] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingInvocationId, setPendingInvocationId] = useState(null);
    const [pendingSubmissionId, setPendingSubmissionId] = useState(null);

    // Anti-cheat: Track internal copy events from the editor

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [probRes, tmplRes] = await Promise.all([
                    api.get(`/problems/${problemId}`),
                    api.get('/user-templates'),
                ]);

                const fetchedProblem = probRes.data.data;
                setProblem(fetchedProblem);

                // Pre-populate sample input
                if (fetchedProblem.sample_test_cases?.length > 0) {
                    setCustomInput(
                        fetchedProblem.sample_test_cases[0].input_data || ''
                    );
                }

                // Setup templates
                const tmpls = tmplRes.data.data || [];
                setTemplates(tmpls);
                const defaultTmpl = tmpls.find((t) => t.is_default);
                if (defaultTmpl) {
                    setSelectedTemplate(defaultTmpl.template_id);
                    setSourceCode(defaultTmpl.source_code);
                    setLanguage(defaultTmpl.language);
                }
            } catch (err) {
                toast.error('Failed to load problem details.');
                navigate(`/contest/${id}/problems`);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, problemId, navigate]);

    useEffect(() => {
        if (!socket) return;

        const handleCustomInvocationUpdate = (data) => {
            if (data.customInvocationId === pendingInvocationId) {
                setIsRunning(false);
                setOutputData(data);
                setPendingInvocationId(null);
            }
        };

        const handleSubmissionUpdate = (data) => {
            if (data.submission_id === pendingSubmissionId) {
                const verdict = data.verdict;
                if (verdict !== 'pending' && verdict !== 'running') {
                    setIsSubmitting(false);
                    setPendingSubmissionId(null);

                    const vDetails = getVerdictDetails(verdict);
                    const desc = `Time: ${data.execution_time_ms}ms | Memory: ${data.memory_used_kb}KB`;

                    if (verdict === 'accepted') {
                        toast.success(vDetails.label, {description: desc});
                        setSolvedIds((prev) => {
                            if (!prev.includes(Number(problemId))) {
                                return [...prev, Number(problemId)];
                            }
                            return prev;
                        });
                    } else if (
                        verdict === 'wrong_answer' ||
                        verdict === 'compilation_error' ||
                        verdict === 'runtime_error'
                    ) {
                        toast.error(vDetails.label, {description: desc});
                    } else {
                        toast.warning(vDetails.label, {description: desc});
                    }
                }
            }
        };

        socket.on('custom_invocation_update', handleCustomInvocationUpdate);
        socket.on('submission_update', handleSubmissionUpdate);

        return () => {
            socket.off(
                'custom_invocation_update',
                handleCustomInvocationUpdate
            );
            socket.off('submission_update', handleSubmissionUpdate);
        };
    }, [
        socket,
        pendingInvocationId,
        pendingSubmissionId,
        problemId,
        setSolvedIds,
    ]);

    // Anti-cheat: Track internal copy events
    useEffect(() => {
        const handleGlobalCopy = () => {
            if (editorRef.current && editorRef.current.hasTextFocus()) {
                const selection = editorRef.current.getSelection();
                if (selection && !selection.isEmpty()) {
                    const text = editorRef.current
                        .getModel()
                        ?.getValueInRange(selection);
                    if (text) {
                        localStorage.setItem('code_editor_clipboard', text);
                    }
                }
            }
        };
        document.addEventListener('copy', handleGlobalCopy);
        return () => document.removeEventListener('copy', handleGlobalCopy);
    }, []);

    const isContestLive = () => {
        if (!contest) return false;
        const now = new Date();
        const start = new Date(contest.contest_start_time);
        const end = new Date(contest.contest_end_time);
        return now >= start && now < end;
    };

    const handlePaste = (e) => {
        if (!isContestLive()) return;

        const pastedText = e.clipboardData.getData('text');
        const storedText = localStorage.getItem('code_editor_clipboard') || '';
        // Standardize line endings for comparison just in case
        if (
            pastedText.replace(/\r\n/g, '\n') !==
            storedText.replace(/\r\n/g, '\n')
        ) {
            e.preventDefault();
            e.stopPropagation();
            toast.error(
                'External paste detected. Pasting from external sources is disabled during contests.',
                {
                    position: 'top-center',
                }
            );
        }
    };

    const handleEditorMount = (editor, monaco) => {
        editorRef.current = editor;
    };

    const startHorizontalResizing = (e) => {
        e.preventDefault();
        setIsResizing('horizontal');
        const handleMouseMove = (e) => {
            const newLeftWidth = (e.clientX / window.innerWidth) * 100;
            setLeftWidth(Math.max(20, Math.min(newLeftWidth, 80)));
        };
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
            setIsResizing(false);
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const startVerticalResizing = (e) => {
        e.preventDefault();
        setIsResizing('vertical');
        const startY = e.clientY;
        const startHeight = panelHeight;
        const handleMouseMove = (e) => {
            const delta = startY - e.clientY;
            setPanelHeight(
                Math.max(
                    100,
                    Math.min(startHeight + delta, window.innerHeight * 0.8)
                )
            );
        };
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
            setIsResizing(false);
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    };

    const handleTemplateChange = (e) => {
        const tId = e.target.value;
        setSelectedTemplate(tId);
        if (tId === 'none') {
            setSourceCode('');
            return;
        }
        const tmpl = templates.find((t) => t.template_id == tId);
        if (tmpl) {
            setSourceCode(tmpl.source_code);
            setLanguage(tmpl.language);
        }
    };

    const handleRunCode = async () => {
        if (!sourceCode.trim()) {
            return toast.error('Code cannot be empty');
        }
        setIsRunning(true);
        setIsPanelOpen(true);
        setActiveTab('result');
        setOutputData(null);

        try {
            const res = await api.post('/submissions/run-sample', {
                problem_id: problemId,
                language,
                source_code: sourceCode,
                input_data: customInput,
            });

            const invocationId = res.data.data.customInvocationId;
            setPendingInvocationId(invocationId);
        } catch (error) {
            setIsRunning(false);
            toast.error(
                error.response?.data?.message || 'Failed to submit run task.'
            );
        }
    };

    const handleSubmitCode = async () => {
        if (!sourceCode.trim()) {
            return toast.error('Code cannot be empty');
        }
        setIsSubmitting(true);
        try {
            const res = await api.post('/submissions', {
                problem_id: problemId,
                language,
                source_code: sourceCode,
            });
            const submissionId = res.data.data.submission_id;
            setPendingSubmissionId(submissionId);
        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Failed to submit code.'
            );
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!problem) return null;

    const problemIndex = problems.findIndex(
        (p) => p.problem_id === Number(problemId)
    );
    const prevProblem = problemIndex > 0 ? problems[problemIndex - 1] : null;
    const nextProblem =
        problemIndex !== -1 && problemIndex < problems.length - 1
            ? problems[problemIndex + 1]
            : null;
    const problemLetter =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[problemIndex] || problemIndex + 1;

    return (
        <div className="flex-1 flex flex-col w-full overflow-hidden bg-card animate-in fade-in duration-500 min-h-0 border-t border-border">
            {/* Header bar */}
            <div className="h-12 bg-muted/40 border-b border-border flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 -ml-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                        asChild
                    >
                        <Link to={`/contest/${id}/problems`}>
                            <ChevronLeft className="w-4 h-4" /> Back
                        </Link>
                    </Button>
                    <div className="flex items-center ml-2 border-l border-border pl-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs font-medium text-muted-foreground hover:text-foreground"
                            asChild
                        >
                            <Link to={`/contest/${id}/problems`}>Problems</Link>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs font-medium text-muted-foreground hover:text-foreground"
                            asChild
                        >
                            <Link to={`/contest/${id}/submissions`}>
                                Submissions
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs font-medium text-muted-foreground hover:text-foreground"
                            asChild
                        >
                            <Link to={`/contest/${id}/leaderboard`}>
                                Leaderboard
                            </Link>
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm font-semibold tracking-wide">
                    <div className="flex items-center border-r border-border pr-4 mr-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={!prevProblem}
                            asChild={!!prevProblem}
                        >
                            {prevProblem ? (
                                <Link
                                    to={`/contest/${id}/problem/${prevProblem.problem_id}`}
                                >
                                    Prev
                                </Link>
                            ) : (
                                <span>Prev</span>
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={!nextProblem}
                            asChild={!!nextProblem}
                        >
                            {nextProblem ? (
                                <Link
                                    to={`/contest/${id}/problem/${nextProblem.problem_id}`}
                                >
                                    Next
                                </Link>
                            ) : (
                                <span>Next</span>
                            )}
                        </Button>
                    </div>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {problem.time_limit_ms}ms
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Database className="w-4 h-4" />
                        {problem.memory_limit_mb}MB
                    </span>
                    <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded text-xs">
                        {problem.score} pts
                    </span>
                </div>
            </div>

            {/* Split View Container */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* LEFT PANE: Problem Statement */}
                <div
                    style={{width: `${leftWidth}%`}}
                    className={`h-full overflow-y-auto custom-scrollbar p-6 ${isContestLive() ? 'select-none' : ''}`}
                    onCopy={(e) => {
                        if (isContestLive()) {
                            e.preventDefault();
                            toast.error(
                                'Copying problem statements is disabled during live contests.'
                            );
                        }
                    }}
                >
                    <h1 className="text-2xl font-serif font-semibold text-foreground mb-6 flex items-center gap-3">
                        <span>
                            {problemLetter}. {problem.title}
                        </span>
                        {solvedIds && solvedIds.includes(Number(problemId)) && (
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        )}
                    </h1>
                    <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary mb-12">
                        <MDEditor.Markdown source={problem.statement} />
                    </div>
                    {problem.explanation && (
                        <div className="pt-6 border-t border-border">
                            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">
                                Note
                            </h3>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground text-sm">
                                <MDEditor.Markdown
                                    source={problem.explanation}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* HORIZONTAL RESIZER */}
                <div
                    className="w-1.5 bg-border hover:bg-primary/50 cursor-col-resize transition-colors shrink-0 flex items-center justify-center z-10"
                    onMouseDown={startHorizontalResizing}
                >
                    <GripVertical className="w-3 h-3 text-muted-foreground/40" />
                </div>

                {/* RIGHT PANE: Editor & Terminal */}
                <div
                    style={{width: `${100 - leftWidth}%`}}
                    className="h-full flex flex-col min-w-[300px] min-h-0"
                >
                    {/* Editor Toolbar */}
                    <div className="h-10 border-b border-border bg-muted/20 flex items-center px-4 justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <Code2 className="w-4 h-4 text-muted-foreground" />
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="text-xs bg-transparent border-none font-semibold text-foreground focus:outline-none focus:ring-0 cursor-pointer"
                            >
                                {VALID_LANGUAGES.map((lang) => (
                                    <option
                                        key={lang}
                                        value={lang}
                                        className="bg-background"
                                    >
                                        {LANG_LABEL[lang]}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <FileCode2 className="w-4 h-4 text-muted-foreground" />
                            <select
                                value={selectedTemplate}
                                onChange={handleTemplateChange}
                                className="text-xs bg-secondary border border-border rounded px-2 py-1 font-medium text-foreground focus:outline-none"
                            >
                                <option value="none" className="bg-background">
                                    Blank Canvas
                                </option>
                                {templates.map((t) => (
                                    <option
                                        key={t.template_id}
                                        value={t.template_id}
                                        className="bg-background"
                                    >
                                        {t.title}{' '}
                                        {t.is_default ? '(Default)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Monaco Editor */}
                    <div
                        className="flex-1 relative bg-background min-h-0"
                        onPasteCapture={handlePaste}
                        onCopyCapture={(e) => {}}
                    >
                        {isResizing && (
                            <div
                                className={`absolute inset-0 z-50 ${isResizing === 'horizontal' ? 'cursor-col-resize' : 'cursor-row-resize'}`}
                            />
                        )}

                        <div
                            className={`absolute inset-0 z-40 bg-card flex flex-col border border-border transition-all duration-300 ease-in-out ${isHelpOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible pointer-events-none translate-y-2'}`}
                        >
                            <HelpContent contest={contest} />
                        </div>

                        <Editor
                            height="100%"
                            language={
                                language === 'cpp'
                                    ? 'cpp'
                                    : language === 'javascript'
                                      ? 'javascript'
                                      : language === 'python'
                                        ? 'python'
                                        : language === 'java'
                                          ? 'java'
                                          : 'c'
                            }
                            theme={editorTheme}
                            value={sourceCode}
                            onChange={(val) => setSourceCode(val || '')}
                            onMount={handleEditorMount}
                            options={{
                                minimap: {enabled: false},
                                fontSize: 14,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: {top: 12},
                                contextmenu: false, // Disable right-click to heavily enforce internal paste only
                            }}
                            loading={
                                <div className="flex h-full items-center justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                            }
                        />
                    </div>

                    {/* VERTICAL RESIZER (If panel open) */}
                    {isPanelOpen && (
                        <div
                            className="h-1.5 bg-border hover:bg-primary/50 cursor-row-resize transition-colors shrink-0 flex items-center justify-center z-10"
                            onMouseDown={startVerticalResizing}
                        >
                            <GripHorizontal className="w-3 h-3 text-muted-foreground/40" />
                        </div>
                    )}

                    {/* Bottom Console Panel */}
                    <div
                        className="border-t border-border bg-card shrink-0 flex flex-col transition-all duration-200"
                        style={{height: isPanelOpen ? panelHeight : '44px'}}
                    >
                        {/* Console Header Tabs */}
                        <div className="h-11 flex items-center justify-between px-2 bg-muted/10 shrink-0">
                            <div className="flex items-center h-full">
                                <button
                                    onClick={() => {
                                        setIsPanelOpen(true);
                                        setActiveTab('testcase');
                                    }}
                                    className={`px-4 h-full text-xs font-semibold uppercase tracking-wider flex items-center border-b-2 transition-colors ${isPanelOpen && activeTab === 'testcase' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                >
                                    Testcase
                                </button>
                                <button
                                    onClick={() => {
                                        setIsPanelOpen(true);
                                        setActiveTab('result');
                                    }}
                                    className={`px-4 h-full text-xs font-semibold uppercase tracking-wider flex items-center border-b-2 transition-colors ${isPanelOpen && activeTab === 'result' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                >
                                    Test Result
                                </button>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground"
                                onClick={() => setIsPanelOpen(!isPanelOpen)}
                            >
                                {isPanelOpen ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronUp className="w-4 h-4" />
                                )}
                            </Button>
                        </div>

                        {/* Console Body */}
                        {isPanelOpen && (
                            <div className="flex-1 overflow-hidden flex flex-col relative">
                                {activeTab === 'testcase' && (
                                    <div className="flex-1 p-3 flex flex-col">
                                        <div className="text-xs text-muted-foreground mb-2 font-semibold">
                                            Custom Input
                                        </div>
                                        <textarea
                                            value={customInput}
                                            onChange={(e) =>
                                                setCustomInput(e.target.value)
                                            }
                                            spellCheck={false}
                                            className="flex-1 w-full bg-muted/30 border border-border rounded-md p-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                            placeholder="Enter custom input here..."
                                        />
                                    </div>
                                )}

                                {activeTab === 'result' && (
                                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                                        {isRunning ? (
                                            <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
                                                <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
                                                <span className="text-sm font-semibold tracking-widest uppercase animate-pulse">
                                                    Evaluating Code...
                                                </span>
                                            </div>
                                        ) : !outputData ? (
                                            <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground/50">
                                                <Terminal className="w-10 h-10 mb-2 opacity-20" />
                                                <span className="text-sm">
                                                    Run your code to see the
                                                    results here.
                                                </span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-4">
                                                    {(() => {
                                                        const v =
                                                            getVerdictDetails(
                                                                outputData.verdict
                                                            );
                                                        return (
                                                            <span
                                                                className={`px-3 py-1 rounded-md text-sm ${v.colorClass}`}
                                                            >
                                                                {v.label}
                                                            </span>
                                                        );
                                                    })()}
                                                    {outputData.executionTimeMs !==
                                                        undefined && (
                                                        <span className="text-sm font-mono text-muted-foreground flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5" />{' '}
                                                            {
                                                                outputData.executionTimeMs
                                                            }{' '}
                                                            ms
                                                        </span>
                                                    )}
                                                    {outputData.memoryUsedKb !==
                                                        undefined && (
                                                        <span className="text-sm font-mono text-muted-foreground flex items-center gap-1.5">
                                                            <Database className="w-3.5 h-3.5" />{' '}
                                                            {
                                                                outputData.memoryUsedKb
                                                            }{' '}
                                                            KB
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                                                        Output / Error
                                                    </div>
                                                    <pre className="bg-black/5 dark:bg-black/40 border border-border p-3 rounded-md text-sm font-mono text-foreground whitespace-pre-wrap min-h-[80px]">
                                                        {outputData.compilationError ||
                                                            outputData.error ||
                                                            outputData.output ||
                                                            'Execution completed without output.'}
                                                    </pre>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Execution Actions (Footer) */}
                    <div className="h-14 border-t border-border bg-muted/20 flex items-center justify-between px-4 gap-3 shrink-0">
                        <div>
                            <Button
                                variant={isHelpOpen ? 'default' : 'outline'}
                                className={`w-28 font-semibold flex items-center justify-center transition-all duration-300 ${isHelpOpen ? 'bg-primary text-primary-foreground' : ''}`}
                                onClick={() => setIsHelpOpen(!isHelpOpen)}
                            >
                                {isHelpOpen ? 'Close Help' : 'Help'}
                            </Button>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="secondary"
                                className="gap-2 w-32"
                                onClick={handleRunCode}
                                disabled={isRunning || isSubmitting}
                            >
                                {isRunning ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Play className="w-4 h-4" />
                                )}
                                Run Code
                            </Button>
                            <Button
                                className="gap-2 w-32 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={handleSubmitCode}
                                disabled={isRunning || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                Submit
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
