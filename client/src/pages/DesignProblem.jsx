import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    FileText,
    Plus,
    Pencil,
    Trash2,
    ChevronDown,
    Clock,
    Cpu,
    Star,
    Trophy,
    X,
    Save,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    title: '',
    score: '',
    rating: '',
    statement: '',
    explanation: '',
    time_limit_ms: '2000',
    memory_limit_mb: '256',
};

export default function DesignProblem() {
    const [contests, setContests] = useState([]);
    const [selectedContestId, setSelectedContestId] = useState('');
    const [problems, setProblems] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [loadingContests, setLoadingContests] = useState(true);
    const [loadingProblems, setLoadingProblems] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // Fetch contests authored by the logged-in user
    useEffect(() => {
        const fetchContests = async () => {
            setLoadingContests(true);
            try {
                const res = await api.get('/contests');
                // The server returns contests the user authored (or admin sees all)
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

    const handleContestChange = (val) => {
        setSelectedContestId(val);
        setProblems([]);
        setForm(EMPTY_FORM);
        setEditingId(null);
        fetchProblems(val);
    };

    const handleFormChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectFieldChange = (name, val) => {
        setForm((prev) => ({ ...prev, [name]: val }));
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
    };

    const handleEditProblem = (problem) => {
        setForm({
            title: problem.title ?? '',
            score: String(problem.score ?? ''),
            rating: String(problem.rating ?? ''),
            statement: problem.statement ?? '',
            explanation: problem.explanation ?? '',
            time_limit_ms: String(problem.time_limit_ms ?? 2000),
            memory_limit_mb: String(problem.memory_limit_mb ?? 256),
        });
        setEditingId(problem.problem_id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteProblem = async (problemId) => {
        setDeletingId(problemId);
        try {
            await api.delete(`/problems/${problemId}`);
            toast.success('Problem deleted successfully.');
            setProblems((prev) => prev.filter((p) => p.problem_id !== problemId));
            if (editingId === problemId) resetForm();
        } catch (err) {
            toast.error(
                err?.response?.data?.message || 'Failed to delete problem.'
            );
        } finally {
            setDeletingId(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedContestId) {
            toast.error('Please select a contest first.');
            return;
        }
        if (!form.title.trim()) {
            toast.error('Title is required.');
            return;
        }
        if (form.score === '' || isNaN(Number(form.score))) {
            toast.error('Score is required and must be a number.');
            return;
        }
        if (Number(form.score) < 0 || Number(form.score) > 5000) {
            toast.error('Score must be between 0 and 5000.');
            return;
        }
        if (form.rating === '' || isNaN(Number(form.rating))) {
            toast.error('Rating is required and must be a number.');
            return;
        }
        if (!form.statement.trim()) {
            toast.error('Problem statement is required.');
            return;
        }

        setSubmitting(true);
        try {
            if (editingId) {
                await api.patch(`/problems/${editingId}`, {
                    title: form.title,
                    score: Number(form.score),
                    rating: Number(form.rating),
                    statement: form.statement,
                    explanation: form.explanation || undefined,
                    time_limit_ms: Number(form.time_limit_ms),
                    memory_limit_mb: Number(form.memory_limit_mb),
                });
                toast.success('Problem updated successfully.');
            } else {
                await api.post('/problems', {
                    contest_id: Number(selectedContestId),
                    title: form.title,
                    score: Number(form.score),
                    rating: Number(form.rating),
                    statement: form.statement,
                    explanation: form.explanation || undefined,
                    time_limit_ms: Number(form.time_limit_ms),
                    memory_limit_mb: Number(form.memory_limit_mb),
                });
                toast.success('Problem created successfully.');
            }
            resetForm();
            fetchProblems(selectedContestId);
        } catch (err) {
            toast.error(
                err?.response?.data?.message || 'Failed to save problem.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const selectedContest = contests.find(
        (c) => String(c.contest_id) === selectedContestId
    );

    return (
        <div className="min-h-screen bg-background">
            {/* Page Header */}
            <div className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
                            <FileText className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Design Problem
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Create and manage problems for your contests
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Contest Selector */}
                <div className="mb-8 p-5 rounded-xl border border-border bg-card shadow-sm">
                    <Label
                        htmlFor="contest-select"
                        className="text-sm font-semibold text-foreground mb-2 block"
                    >
                        Select Contest
                    </Label>
                    {loadingContests ? (
                        <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
                    ) : contests.length === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>
                                No contests found. Create a contest first.
                            </span>
                        </div>
                    ) : (
                        <Select
                            value={selectedContestId}
                            onValueChange={handleContestChange}
                        >
                            <SelectTrigger id="contest-select" className="w-full max-w-md">
                                <SelectValue placeholder="Choose a contest…" />
                            </SelectTrigger>
                            <SelectContent>
                                {contests.map((c) => (
                                    <SelectItem
                                        key={c.contest_id}
                                        value={String(c.contest_id)}
                                    >
                                        {c.title}
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            (Div. {c.division})
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Two-panel layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEFT: Form */}
                    <div className="space-y-6">
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
                                            ? 'Edit Problem'
                                            : 'New Problem'}
                                    </span>
                                </div>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                        Cancel edit
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* Title */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="prob-title">
                                        Title{' '}
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="prob-title"
                                        name="title"
                                        placeholder="e.g. Two Sum"
                                        value={form.title}
                                        onChange={handleFormChange}
                                    />
                                </div>

                                {/* Score + Rating row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="prob-score">
                                            Score (0–5000){' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <div className="relative">
                                            <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                            <Input
                                                id="prob-score"
                                                name="score"
                                                type="number"
                                                min="0"
                                                max="5000"
                                                placeholder="e.g. 1000"
                                                value={form.score}
                                                onChange={handleFormChange}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="prob-rating">
                                            Rating{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <div className="relative">
                                            <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                            <Input
                                                id="prob-rating"
                                                name="rating"
                                                type="number"
                                                placeholder="e.g. 1200"
                                                value={form.rating}
                                                onChange={handleFormChange}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Time + Memory row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="prob-time">
                                            Time Limit (ms)
                                        </Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                            <Input
                                                id="prob-time"
                                                name="time_limit_ms"
                                                type="number"
                                                min="100"
                                                placeholder="2000"
                                                value={form.time_limit_ms}
                                                onChange={handleFormChange}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="prob-memory">
                                            Memory Limit (MB)
                                        </Label>
                                        <div className="relative">
                                            <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                            <Input
                                                id="prob-memory"
                                                name="memory_limit_mb"
                                                type="number"
                                                min="16"
                                                placeholder="256"
                                                value={form.memory_limit_mb}
                                                onChange={handleFormChange}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Statement */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="prob-statement">
                                        Problem Statement{' '}
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Textarea
                                        id="prob-statement"
                                        name="statement"
                                        placeholder="Describe the problem clearly. You may use plain text or Markdown."
                                        rows={6}
                                        value={form.statement}
                                        onChange={handleFormChange}
                                        className="resize-y font-mono text-sm"
                                    />
                                </div>

                                {/* Explanation */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="prob-explanation">
                                        Explanation{' '}
                                        <span className="text-xs text-muted-foreground font-normal">
                                            (optional)
                                        </span>
                                    </Label>
                                    <Textarea
                                        id="prob-explanation"
                                        name="explanation"
                                        placeholder="Explain the solution approach or editorial notes…"
                                        rows={4}
                                        value={form.explanation}
                                        onChange={handleFormChange}
                                        className="resize-y font-mono text-sm"
                                    />
                                </div>

                                <div className="flex gap-3 pt-1">
                                    <Button
                                        id="prob-submit"
                                        type="submit"
                                        disabled={submitting || !selectedContestId}
                                        className="flex-1 gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        {submitting
                                            ? editingId
                                                ? 'Updating…'
                                                : 'Creating…'
                                            : editingId
                                            ? 'Update Problem'
                                            : 'Create Problem'}
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

                    {/* RIGHT: Problems list */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-foreground">
                                Problems
                                {selectedContest && (
                                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                                        — {selectedContest.title}
                                    </span>
                                )}
                            </h2>
                            {problems.length > 0 && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {problems.length}{' '}
                                    {problems.length === 1 ? 'problem' : 'problems'}
                                </span>
                            )}
                        </div>

                        {!selectedContestId ? (
                            <div className="rounded-xl border border-dashed border-border p-12 text-center">
                                <ChevronDown className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    Select a contest above to see its problems
                                </p>
                            </div>
                        ) : loadingProblems ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="h-24 rounded-xl bg-muted animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : problems.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border p-12 text-center">
                                <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    No problems yet. Create your first one!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {problems.map((problem) => (
                                    <div
                                        key={problem.problem_id}
                                        className={`rounded-xl border bg-card shadow-sm transition-all duration-200 ${
                                            editingId === problem.problem_id
                                                ? 'border-primary ring-1 ring-primary/30'
                                                : 'border-border hover:border-muted-foreground/30 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-foreground truncate">
                                                        {problem.title}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                        {problem.statement}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <Button
                                                        id={`edit-problem-${problem.problem_id}`}
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleEditProblem(problem)
                                                        }
                                                        className="h-8 w-8 p-0"
                                                        title="Edit problem"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        id={`delete-problem-${problem.problem_id}`}
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleDeleteProblem(
                                                                problem.problem_id
                                                            )
                                                        }
                                                        disabled={
                                                            deletingId ===
                                                            problem.problem_id
                                                        }
                                                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-colors"
                                                        title="Delete problem"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Badges row */}
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                                    <Trophy className="w-3 h-3" />
                                                    {problem.score} pts
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                                    <Clock className="w-3 h-3" />
                                                    {problem.time_limit_ms}ms
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                                    <Cpu className="w-3 h-3" />
                                                    {problem.memory_limit_mb}MB
                                                </span>
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
