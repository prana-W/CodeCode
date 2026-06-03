import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    FlaskConical,
    Plus,
    Pencil,
    Trash2,
    ChevronDown,
    X,
    Save,
    CheckSquare,
    Square,
    AlertCircle,
    TerminalSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import api from '@/lib/axios';

const EMPTY_FORM = {
    input_data: '',
    expected_output: '',
    is_sample: false,
};

export default function DesignTestcase() {
    // Contest & problem selectors
    const [contests, setContests] = useState([]);
    const [selectedContestId, setSelectedContestId] = useState('');
    const [problems, setProblems] = useState([]);
    const [selectedProblemId, setSelectedProblemId] = useState('');

    // Testcases
    const [testcases, setTestcases] = useState([]);
    const [existingTestcase, setExistingTestcase] = useState(null); // server enforces 1 per problem

    // Form
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);

    // Loading states
    const [loadingContests, setLoadingContests] = useState(true);
    const [loadingProblems, setLoadingProblems] = useState(false);
    const [loadingTestcases, setLoadingTestcases] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // Fetch contests
    useEffect(() => {
        const fetchContests = async () => {
            setLoadingContests(true);
            try {
                const res = await api.get('/contests');
                setContests(res.data.data || []);
            } catch (err) {
                toast.error(
                    err?.response?.data?.message || 'Failed to load contests.'
                );
            } finally {
                setLoadingContests(false);
            }
        };
        fetchContests();
    }, []);

    // Fetch problems for selected contest
    const fetchProblems = useCallback(async (contestId) => {
        if (!contestId) return;
        setLoadingProblems(true);
        setProblems([]);
        setSelectedProblemId('');
        setTestcases([]);
        setExistingTestcase(null);
        setForm(EMPTY_FORM);
        setEditingId(null);
        try {
            const res = await api.get(`/problems?contest_id=${contestId}`);
            setProblems(res.data.data || []);
        } catch (err) {
            toast.error(
                err?.response?.data?.message || 'Failed to load problems.'
            );
        } finally {
            setLoadingProblems(false);
        }
    }, []);

    // Fetch testcases for selected problem
    const fetchTestcases = useCallback(async (problemId) => {
        if (!problemId) return;
        setLoadingTestcases(true);
        setTestcases([]);
        setExistingTestcase(null);
        setForm(EMPTY_FORM);
        setEditingId(null);
        try {
            const res = await api.get(`/testcases?problem_id=${problemId}`);
            const data = res.data.data || [];
            setTestcases(data);
            // Server allows only 1 testcase per problem
            if (data.length > 0) {
                setExistingTestcase(data[0]);
            }
        } catch (err) {
            toast.error(
                err?.response?.data?.message || 'Failed to load test cases.'
            );
        } finally {
            setLoadingTestcases(false);
        }
    }, []);

    const handleContestChange = (val) => {
        setSelectedContestId(val);
        fetchProblems(val);
    };

    const handleProblemChange = (val) => {
        setSelectedProblemId(val);
        fetchTestcases(val);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const toggleIsSample = () => {
        setForm((prev) => ({ ...prev, is_sample: !prev.is_sample }));
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
    };

    const handleEditTestcase = (tc) => {
        setForm({
            input_data: tc.input_data ?? '',
            expected_output: tc.expected_output ?? '',
            is_sample: Boolean(tc.is_sample),
        });
        setEditingId(tc.test_case_id);
    };

    const handleDeleteTestcase = async (tcId) => {
        setDeletingId(tcId);
        try {
            await api.delete(`/testcases/${tcId}`);
            toast.success('Test case deleted.');
            setTestcases([]);
            setExistingTestcase(null);
            resetForm();
        } catch (err) {
            toast.error(
                err?.response?.data?.message || 'Failed to delete test case.'
            );
        } finally {
            setDeletingId(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedProblemId) {
            toast.error('Please select a problem first.');
            return;
        }
        if (!form.input_data.trim()) {
            toast.error('Input data is required.');
            return;
        }
        if (!form.expected_output.trim()) {
            toast.error('Expected output is required.');
            return;
        }

        setSubmitting(true);
        try {
            if (editingId) {
                await api.patch(`/testcases/${editingId}`, {
                    input_data: form.input_data,
                    expected_output: form.expected_output,
                    is_sample: form.is_sample,
                });
                toast.success('Test case updated successfully.');
            } else {
                await api.post('/testcases', {
                    problem_id: Number(selectedProblemId),
                    input_data: form.input_data,
                    expected_output: form.expected_output,
                    is_sample: form.is_sample,
                });
                toast.success('Test case created successfully.');
            }
            resetForm();
            fetchTestcases(selectedProblemId);
        } catch (err) {
            const status = err?.response?.status;
            const message = err?.response?.data?.message;
            // 409: testcase already exists — offer to switch to edit mode
            if (status === 409 && existingTestcase) {
                toast.error(
                    'A test case already exists for this problem. Use Edit instead.'
                );
                handleEditTestcase(existingTestcase);
            } else {
                toast.error(message || 'Failed to save test case.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const selectedProblem = problems.find(
        (p) => String(p.problem_id) === selectedProblemId
    );

    const isFormMode = editingId || !existingTestcase;

    return (
        <div className="min-h-screen bg-background">
            {/* Page Header */}
            <div className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
                            <FlaskConical className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Design Testcase
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Manage test cases for your problems
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Selectors row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {/* Contest picker */}
                    <div className="p-5 rounded-xl border border-border bg-card shadow-sm">
                        <Label
                            htmlFor="tc-contest-select"
                            className="text-sm font-semibold text-foreground mb-2 block"
                        >
                            1. Select Contest
                        </Label>
                        {loadingContests ? (
                            <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
                        ) : contests.length === 0 ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>No contests found.</span>
                            </div>
                        ) : (
                            <Select
                                value={selectedContestId}
                                onValueChange={handleContestChange}
                            >
                                <SelectTrigger id="tc-contest-select" className="w-full">
                                    <SelectValue placeholder="Choose a contest…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {contests.map((c) => (
                                        <SelectItem
                                            key={c.contest_id}
                                            value={String(c.contest_id)}
                                        >
                                            {c.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Problem picker */}
                    <div className="p-5 rounded-xl border border-border bg-card shadow-sm">
                        <Label
                            htmlFor="tc-problem-select"
                            className="text-sm font-semibold text-foreground mb-2 block"
                        >
                            2. Select Problem
                        </Label>
                        {!selectedContestId ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                                <ChevronDown className="w-4 h-4 flex-shrink-0" />
                                <span>Select a contest first</span>
                            </div>
                        ) : loadingProblems ? (
                            <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
                        ) : problems.length === 0 ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>No problems in this contest yet.</span>
                            </div>
                        ) : (
                            <Select
                                value={selectedProblemId}
                                onValueChange={handleProblemChange}
                            >
                                <SelectTrigger id="tc-problem-select" className="w-full">
                                    <SelectValue placeholder="Choose a problem…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {problems.map((p) => (
                                        <SelectItem
                                            key={p.problem_id}
                                            value={String(p.problem_id)}
                                        >
                                            {p.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                {/* Two-panel layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEFT: Form */}
                    <div>
                        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                            {/* Form header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
                                <div className="flex items-center gap-2">
                                    {editingId ? (
                                        <Pencil className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                        <Plus className="w-4 h-4 text-muted-foreground" />
                                    )}
                                    <span className="font-semibold text-foreground text-sm">
                                        {editingId
                                            ? 'Edit Test Case'
                                            : 'New Test Case'}
                                    </span>
                                </div>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                        Cancel
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* Conflict notice */}
                                {existingTestcase && !editingId && (
                                    <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <div className="text-xs">
                                            <p className="font-semibold">
                                                Testcase already exists
                                            </p>
                                            <p>
                                                Only one test case is allowed per
                                                problem. Use the{' '}
                                                <button
                                                    type="button"
                                                    className="underline font-medium"
                                                    onClick={() =>
                                                        handleEditTestcase(
                                                            existingTestcase
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>{' '}
                                                button to modify it.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Input data */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="tc-input">
                                        Input Data{' '}
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Textarea
                                        id="tc-input"
                                        name="input_data"
                                        placeholder={'5\n1 2 3 4 5'}
                                        rows={6}
                                        value={form.input_data}
                                        onChange={handleFormChange}
                                        className="resize-y font-mono text-sm"
                                        disabled={!!existingTestcase && !editingId}
                                    />
                                </div>

                                {/* Expected output */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="tc-output">
                                        Expected Output{' '}
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Textarea
                                        id="tc-output"
                                        name="expected_output"
                                        placeholder={'15'}
                                        rows={4}
                                        value={form.expected_output}
                                        onChange={handleFormChange}
                                        className="resize-y font-mono text-sm"
                                        disabled={!!existingTestcase && !editingId}
                                    />
                                </div>

                                {/* Is sample toggle */}
                                <div className="flex items-center gap-3">
                                    <button
                                        id="tc-is-sample"
                                        type="button"
                                        onClick={toggleIsSample}
                                        disabled={!!existingTestcase && !editingId}
                                        className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        {form.is_sample ? (
                                            <CheckSquare className="w-5 h-5 text-primary" />
                                        ) : (
                                            <Square className="w-5 h-5 text-muted-foreground" />
                                        )}
                                        Mark as sample (visible to participants)
                                    </button>
                                </div>

                                <div className="flex gap-3 pt-1">
                                    <Button
                                        id="tc-submit"
                                        type="submit"
                                        disabled={
                                            submitting ||
                                            !selectedProblemId ||
                                            (!!existingTestcase && !editingId)
                                        }
                                        className="flex-1 gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        {submitting
                                            ? editingId
                                                ? 'Updating…'
                                                : 'Creating…'
                                            : editingId
                                            ? 'Update Testcase'
                                            : 'Create Testcase'}
                                    </Button>
                                    {editingId && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={resetForm}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT: Testcases list */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-foreground">
                                Test Cases
                                {selectedProblem && (
                                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                                        — {selectedProblem.title}
                                    </span>
                                )}
                            </h2>
                            {testcases.length > 0 && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {testcases.length} /{' '}
                                    <span title="Server enforces 1 testcase per problem">
                                        1 max
                                    </span>
                                </span>
                            )}
                        </div>

                        {!selectedProblemId ? (
                            <div className="rounded-xl border border-dashed border-border p-12 text-center">
                                <ChevronDown className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    Select a problem above to see its test cases
                                </p>
                            </div>
                        ) : loadingTestcases ? (
                            <div className="space-y-3">
                                {[1].map((i) => (
                                    <div
                                        key={i}
                                        className="h-40 rounded-xl bg-muted animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : testcases.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border p-12 text-center">
                                <FlaskConical className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    No test cases yet. Create one!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {testcases.map((tc) => (
                                    <div
                                        key={tc.test_case_id}
                                        className={`rounded-xl border bg-card shadow-sm transition-all duration-200 ${
                                            editingId === tc.test_case_id
                                                ? 'border-primary ring-1 ring-primary/30'
                                                : 'border-border hover:border-muted-foreground/30'
                                        }`}
                                    >
                                        <div className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <TerminalSquare className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-medium text-sm text-foreground">
                                                        Test Case #{tc.test_case_id}
                                                    </span>
                                                    {tc.is_sample && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                                            Sample
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Button
                                                        id={`edit-tc-${tc.test_case_id}`}
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleEditTestcase(tc)
                                                        }
                                                        className="h-8 w-8 p-0"
                                                        title="Edit test case"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        id={`delete-tc-${tc.test_case_id}`}
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleDeleteTestcase(
                                                                tc.test_case_id
                                                            )
                                                        }
                                                        disabled={
                                                            deletingId ===
                                                            tc.test_case_id
                                                        }
                                                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-colors"
                                                        title="Delete test case"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                                                        INPUT
                                                    </p>
                                                    <pre className="text-xs font-mono bg-muted rounded-lg p-3 overflow-auto max-h-28 whitespace-pre-wrap break-all">
                                                        {tc.input_data}
                                                    </pre>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                                                        EXPECTED OUTPUT
                                                    </p>
                                                    <pre className="text-xs font-mono bg-muted rounded-lg p-3 overflow-auto max-h-28 whitespace-pre-wrap break-all">
                                                        {tc.expected_output}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
