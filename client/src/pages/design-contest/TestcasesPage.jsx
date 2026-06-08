import {useState, useEffect, useCallback, useRef} from 'react';
import {useParams, useNavigate, Link} from 'react-router-dom';
import {toast} from 'sonner';
import {
    FlaskConical,
    Pencil,
    Trash2,
    Save,
    LogOut,
    AlertTriangle,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    CheckSquare,
    Square,
    TerminalSquare,
    Sparkles,
    RotateCcw,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import api from '@/lib/axios';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PROBLEM_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const EMPTY_TC = {
    input_data: '',
    expected_output: '',
    sample_input_data: '',
    sample_expected_output: '',
};

function TestcasePanel({problem, index, testcase, onRefresh}) {
    const [open, setOpen] = useState(!testcase);
    const [form, setForm] = useState(EMPTY_TC);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [aiPrompt, setAiPrompt] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const streamControllerRef = useRef(null);

    const hasTestcase = !!testcase;
    const letter = PROBLEM_LETTERS[index] || String(index + 1);

    const handleEdit = () => {
        setForm({
            input_data: testcase.input_data || '',
            expected_output: testcase.expected_output || '',
            sample_input_data: testcase.sample_input_data || '',
            sample_expected_output: testcase.sample_expected_output || '',
        });
        setEditingId(testcase.test_case_id);
        setOpen(true);
    };

    const handleCancel = () => {
        setForm(EMPTY_TC);
        setEditingId(null);
    };

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleDeleteClick = () => {
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            await api.delete(`/testcases/${testcase.test_case_id}`);
            toast.success('Test case deleted.');
            onRefresh();
        } catch (err) {
            toast.error(
                err?.response?.data?.message || 'Failed to delete test case.'
            );
        } finally {
            setDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.input_data.trim())
            return toast.error('Input data is required.');
        if (!form.expected_output.trim())
            return toast.error('Expected output is required.');

        setSubmitting(true);
        try {
            if (editingId) {
                await api.patch(`/testcases/${editingId}`, {
                    input_data: form.input_data,
                    expected_output: form.expected_output,
                    sample_input_data: form.sample_input_data,
                    sample_expected_output: form.sample_expected_output,
                });
                toast.success('Test case updated.');
            } else {
                await api.post('/testcases', {
                    problem_id: problem.problem_id,
                    input_data: form.input_data,
                    expected_output: form.expected_output,
                    sample_input_data: form.sample_input_data,
                    sample_expected_output: form.sample_expected_output,
                });
                toast.success('Test case created.');
            }
            setForm(EMPTY_TC);
            setEditingId(null);
            onRefresh();
        } catch (err) {
            const status = err?.response?.status;
            if (status === 409) {
                toast.error(
                    'A test case already exists for this problem. Use Edit instead.'
                );
                if (testcase) handleEdit();
            } else {
                toast.error(
                    err?.response?.data?.message || 'Failed to save test case.'
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleGenerateTestcase = async () => {
        if (!aiPrompt.trim()) {
            return toast.error(
                'Please provide a custom instruction for the AI.'
            );
        }

        const backupKey = `backup_tc_${problem.problem_id}`;
        localStorage.setItem(backupKey, JSON.stringify(form));

        setIsStreaming(true);
        setForm(EMPTY_TC);
        streamControllerRef.current = new AbortController();

        try {
            const token = localStorage.getItem('token');
            const apiUrl =
                import.meta.env.VITE_SERVER_URL ||
                'http://localhost:8000/api/v1';
            const response = await fetch(`${apiUrl}/ai/external/stream`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    intent: 'testcase_generation',
                    prompt: `Custom Instruction: ${aiPrompt}\\n\\n### Problem Statement:\\n${problem.statement}`,
                }),
                signal: streamControllerRef.current.signal,
            });

            if (!response.ok) throw new Error('Network error');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let currentContent = '';

            const fieldMap = {
                '[HIDDEN_INPUT]': 'input_data',
                '[HIDDEN_OUTPUT]': 'expected_output',
                '[SAMPLE_INPUT]': 'sample_input_data',
                '[SAMPLE_OUTPUT]': 'sample_expected_output',
            };

            while (!done) {
                const {value, done: readerDone} = await reader.read();
                done = readerDone;
                if (value) {
                    const chunkStr = decoder.decode(value, {stream: true});
                    const lines = chunkStr.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.slice(6);
                            if (dataStr === '[DONE]') {
                                done = true;
                                break;
                            }
                            try {
                                const parsed = JSON.parse(dataStr);
                                if (parsed.text) {
                                    currentContent += parsed.text;
                                    let newFormState = {};
                                    const markerRegex =
                                        /\[(HIDDEN_INPUT|HIDDEN_OUTPUT|SAMPLE_INPUT|SAMPLE_OUTPUT)\]/g;
                                    let matches = [];
                                    let match;
                                    while (
                                        (match =
                                            markerRegex.exec(
                                                currentContent
                                            )) !== null
                                    ) {
                                        matches.push({
                                            type: `[${match[1]}]`,
                                            index: match.index,
                                        });
                                    }

                                    if (matches.length > 0) {
                                        for (
                                            let i = 0;
                                            i < matches.length;
                                            i++
                                        ) {
                                            const startIdx =
                                                matches[i].index +
                                                matches[i].type.length;
                                            const endIdx =
                                                i + 1 < matches.length
                                                    ? matches[i + 1].index
                                                    : currentContent.length;
                                            const content = currentContent
                                                .substring(startIdx, endIdx)
                                                .replace(/^\\s+/, '');
                                            const field =
                                                fieldMap[matches[i].type];
                                            if (field) {
                                                newFormState[field] = content;
                                            }
                                        }
                                        setForm((prev) => ({
                                            ...prev,
                                            ...newFormState,
                                        }));
                                    }
                                } else if (parsed.error) {
                                    toast.error(parsed.error);
                                }
                            } catch (e) {
                                // ignore parse error for partial chunks
                            }
                        }
                    }
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                toast.success('AI generation stopped.');
            } else {
                toast.error('Failed to stream AI response.');
            }
        } finally {
            setIsStreaming(false);
            streamControllerRef.current = null;
        }
    };

    const handleStopStream = () => {
        if (streamControllerRef.current) {
            streamControllerRef.current.abort();
        }
    };

    const handleRevertTestcase = () => {
        const backupKey = `backup_tc_${problem.problem_id}`;
        const backup = localStorage.getItem(backupKey);
        if (backup) {
            try {
                setForm(JSON.parse(backup));
                toast.success('Testcase reverted.');
            } catch (e) {
                toast.error('Failed to parse backup.');
            }
        } else {
            toast.error('No previous version found.');
        }
    };

    return (
        <div
            className={`rounded-xl border overflow-hidden transition-colors ${
                hasTestcase
                    ? 'border-border'
                    : 'border-amber-500/30 bg-amber-500/5'
            }`}
        >
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="problem-letter w-7 h-7 text-xs font-mono">
                        {letter}
                    </div>
                    <span className="font-medium text-sm text-foreground">
                        {problem.title}
                    </span>
                    {hasTestcase ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            Has testcase
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-semibold animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Missing
                        </span>
                    )}
                    {hasTestcase && testcase.sample_input_data && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                            Sample included
                        </span>
                    )}
                </div>
                {open ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
            </button>

            {open && (
                <div className="p-4 space-y-4 border-t border-border">
                    {hasTestcase && !editingId && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TerminalSquare className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-semibold text-sm font-mono">
                                        Test Case #{testcase.test_case_id}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        id={`edit-tc-${testcase.test_case_id}`}
                                        size="sm"
                                        variant="outline"
                                        onClick={handleEdit}
                                        className="h-7 gap-1 text-[10px] font-semibold uppercase tracking-wider"
                                    >
                                        <Pencil className="w-3 h-3" />
                                        Edit
                                    </Button>
                                    <Button
                                        id={`delete-tc-${testcase.test_case_id}`}
                                        size="sm"
                                        variant="outline"
                                        onClick={handleDeleteClick}
                                        disabled={deleting}
                                        className="h-7 gap-1 text-[10px] font-semibold uppercase tracking-wider hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        {deleting ? 'Deleting…' : 'Delete'}
                                    </Button>
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                                        Hidden Input
                                    </p>
                                    <pre className="text-xs font-mono bg-muted/30 border rounded-lg p-3 overflow-auto max-h-32 whitespace-pre-wrap break-all shadow-inner">
                                        {testcase.input_data}
                                    </pre>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                                        Hidden Expected Output
                                    </p>
                                    <pre className="text-xs font-mono bg-muted/30 border rounded-lg p-3 overflow-auto max-h-32 whitespace-pre-wrap break-all shadow-inner">
                                        {testcase.expected_output}
                                    </pre>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                                        Sample Input
                                    </p>
                                    <pre className="text-xs font-mono bg-muted/30 border rounded-lg p-3 overflow-auto max-h-32 whitespace-pre-wrap break-all shadow-inner">
                                        {testcase.sample_input_data}
                                    </pre>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                                        Sample Expected Output
                                    </p>
                                    <pre className="text-xs font-mono bg-muted/30 border rounded-lg p-3 overflow-auto max-h-32 whitespace-pre-wrap break-all shadow-inner">
                                        {testcase.sample_expected_output}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}

                    {(editingId || !hasTestcase) && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor={`tc-input-${problem.problem_id}`}
                                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                    >
                                        Hidden Input Data{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Textarea
                                        id={`tc-input-${problem.problem_id}`}
                                        rows={4}
                                        placeholder={'3\n1 2 3'}
                                        value={form.input_data}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                input_data: e.target.value,
                                            }))
                                        }
                                        className="resize-y font-mono text-sm bg-muted/10"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor={`tc-output-${problem.problem_id}`}
                                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                    >
                                        Hidden Expected Output{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Textarea
                                        id={`tc-output-${problem.problem_id}`}
                                        rows={4}
                                        placeholder={'6'}
                                        value={form.expected_output}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                expected_output: e.target.value,
                                            }))
                                        }
                                        className="resize-y font-mono text-sm bg-muted/10"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor={`tc-sample-input-${problem.problem_id}`}
                                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                    >
                                        Sample Input Data{' '}
                                        <span className="text-muted-foreground font-normal lowercase">
                                            (Visible to contestants)
                                        </span>
                                    </Label>
                                    <Textarea
                                        id={`tc-sample-input-${problem.problem_id}`}
                                        rows={3}
                                        placeholder={'Sample input...'}
                                        value={form.sample_input_data}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                sample_input_data:
                                                    e.target.value,
                                            }))
                                        }
                                        className="resize-y font-mono text-sm bg-muted/10"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor={`tc-sample-output-${problem.problem_id}`}
                                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                    >
                                        Sample Expected Output
                                    </Label>
                                    <Textarea
                                        id={`tc-sample-output-${problem.problem_id}`}
                                        rows={3}
                                        placeholder={'Sample output...'}
                                        value={form.sample_expected_output}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                sample_expected_output:
                                                    e.target.value,
                                            }))
                                        }
                                        className="resize-y font-mono text-sm bg-muted/10"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-6 mt-4 border-t border-border">
                                <div className="flex-1 w-full max-w-lg space-y-2 bg-muted/20 p-4 rounded-xl border border-border">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                                            AI Testcase Generator
                                        </h4>
                                    </div>
                                    <Textarea
                                        rows={2}
                                        placeholder="e.g. Generate an edge case where array contains all negative numbers and n=1000..."
                                        value={aiPrompt}
                                        onChange={(e) =>
                                            setAiPrompt(e.target.value)
                                        }
                                        disabled={isStreaming}
                                        className="text-xs resize-y min-h-[60px]"
                                    />
                                    <div className="flex gap-2">
                                        {!isStreaming ? (
                                            <Button
                                                type="button"
                                                onClick={handleGenerateTestcase}
                                                size="sm"
                                                className="gap-1.5 h-8 text-xs bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border-0"
                                            >
                                                <Sparkles className="w-3.5 h-3.5" />
                                                Generate
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                onClick={handleStopStream}
                                                size="sm"
                                                variant="destructive"
                                                className="gap-1.5 h-8 text-xs"
                                            >
                                                <Square className="w-3.5 h-3.5" />
                                                Stop Generating
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            onClick={handleRevertTestcase}
                                            size="sm"
                                            variant="outline"
                                            disabled={isStreaming}
                                            className="gap-1.5 h-8 text-xs"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            Revert
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 shrink-0">
                                    {editingId && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancel}
                                            disabled={isStreaming}
                                            className="text-xs font-semibold uppercase tracking-wider"
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                    <Button
                                        id={`tc-submit-${problem.problem_id}`}
                                        type="submit"
                                        size="sm"
                                        disabled={submitting || isStreaming}
                                        className="gap-1.5 text-xs font-semibold uppercase tracking-wider"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        {submitting
                                            ? editingId
                                                ? 'Updating…'
                                                : 'Creating…'
                                            : editingId
                                              ? 'Update'
                                              : 'Create'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            )}

            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Testcase</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this testcase? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setShowDeleteDialog(false)}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default function TestcasesPage() {
    const {contestId} = useParams();
    const navigate = useNavigate();

    const [contestTitle, setContestTitle] = useState('');
    const [problems, setProblems] = useState([]);
    const [testcaseMap, setTestcaseMap] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [contestRes, probRes] = await Promise.all([
                api.get(`/contests/${contestId}`),
                api.get(`/problems?contest_id=${contestId}`),
            ]);
            setContestTitle(contestRes.data.data?.title || '');
            const probs = probRes.data.data || [];
            setProblems(probs);

            const tcMap = {};
            await Promise.all(
                probs.map(async (p) => {
                    try {
                        const tcRes = await api.get(
                            `/testcases?problem_id=${p.problem_id}`
                        );
                        const data = tcRes.data.data || [];
                        tcMap[p.problem_id] = data.length > 0 ? data[0] : null;
                    } catch {
                        tcMap[p.problem_id] = null;
                    }
                })
            );
            setTestcaseMap(tcMap);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to load data.');
            navigate('/design-contest');
        }
    }, [contestId, navigate]);

    useEffect(() => {
        setLoading(true);
        fetchData().finally(() => setLoading(false));
    }, [fetchData]);

    const handleRefresh = () => fetchData();

    const missingCount = problems.filter(
        (p) => !testcaseMap[p.problem_id]
    ).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="border-b border-border bg-card/50">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                        <div className="skeleton h-4 w-40 rounded mb-4" />
                        <div className="skeleton h-8 w-56 rounded mb-2" />
                        <div className="skeleton h-4 w-72 rounded" />
                    </div>
                </div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton h-16 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b border-border bg-card/50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                    <nav className="flex items-center mb-4 font-mono text-xs">
                        <Link
                            to="/design-contest"
                            className="breadcrumb-link text-muted-foreground hover:text-foreground"
                        >
                            My Contests
                        </Link>
                        <span className="breadcrumb-sep mx-2 text-muted-foreground/50">
                            ›
                        </span>
                        <Link
                            to={`/design-contest/contest/${contestId}`}
                            className="breadcrumb-link text-muted-foreground hover:text-foreground"
                        >
                            {contestTitle}
                        </Link>
                        <span className="breadcrumb-sep mx-2 text-muted-foreground/50">
                            ›
                        </span>
                        <span className="text-foreground font-medium">
                            Test Cases
                        </span>
                    </nav>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
                            <FlaskConical className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight text-foreground">
                                Test Cases
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Manage test cases for all problems in "
                                {contestTitle}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                {missingCount > 0 && (
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-foreground font-sans">
                                {missingCount} problem
                                {missingCount > 1 ? 's' : ''} missing test cases
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                                {problems
                                    .filter((p) => !testcaseMap[p.problem_id])
                                    .map(
                                        (p, i) =>
                                            `${PROBLEM_LETTERS[problems.indexOf(p)] || i + 1}. ${p.title}`
                                    )
                                    .join(', ')}
                            </p>
                        </div>
                    </div>
                )}

                {problems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border py-16 text-center">
                        <FlaskConical className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            No problems in this contest yet. Add problems first.
                        </p>
                        <Button
                            className="mt-4 gap-2 text-xs font-semibold uppercase tracking-wider"
                            onClick={() =>
                                navigate(
                                    `/design-contest/problems/${contestId}`
                                )
                            }
                        >
                            <Plus className="w-4 h-4" />
                            Add Problems
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {problems.map((problem, idx) => (
                            <TestcasePanel
                                key={problem.problem_id}
                                problem={problem}
                                index={idx}
                                testcase={testcaseMap[problem.problem_id]}
                                onRefresh={handleRefresh}
                            />
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between pt-6 border-t border-border">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/design-contest')}
                        className="gap-2 text-xs font-semibold uppercase tracking-wider"
                    >
                        <LogOut className="w-4 h-4" />
                        Save & Exit
                    </Button>
                    <Button
                        id="finish-btn"
                        onClick={() => {
                            if (missingCount > 0) {
                                toast.warning(
                                    `${missingCount} problem(s) still missing test cases.`,
                                    {
                                        description:
                                            "You can continue, but the contest won't be fully ready.",
                                    }
                                );
                            }
                            toast.success('🎉 All changes saved!', {
                                description: `"${contestTitle}" is ready for admin review.`,
                            });
                            navigate('/design-contest');
                        }}
                        className="gap-2 text-xs font-semibold uppercase tracking-wider"
                    >
                        <Save className="w-4 h-4" />
                        Save & Finish
                    </Button>
                </div>
            </div>
        </div>
    );
}
