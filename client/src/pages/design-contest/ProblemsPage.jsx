import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Plus, Pencil, Trash2, Save, LogOut, ChevronRight,
    Star, Clock, Cpu, Hash, BookOpen, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MDEditor from '@uiw/react-md-editor';
import api from '@/lib/axios';

const EMPTY_FORM = {
    title: '', score: '', rating: '',
    statement: '', explanation: '',
    time_limit_ms: '2000', memory_limit_mb: '256',
};

const PROBLEM_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// ─── Problem Card ────────────────────────────────────────────────────────
function ProblemCard({ problem, index, isEditing, onEdit, onDelete, deleting }) {
    return (
        <div
            className={`rounded-xl border bg-card transition-all duration-200 ${
                isEditing
                    ? 'border-primary ring-1 ring-primary/20'
                    : 'border-border hover:border-muted-foreground/30'
            }`}
        >
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className="problem-letter shrink-0 mt-0.5">
                        {PROBLEM_LETTERS[index] || index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-[15px] leading-tight">
                            {problem.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {problem.statement?.slice(0, 120)}
                            {problem.statement?.length > 120 ? '…' : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                            id={`edit-prob-${problem.problem_id}`}
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(problem)}
                            className="h-8 w-8 p-0"
                            title="Edit problem"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            id={`delete-prob-${problem.problem_id}`}
                            size="sm"
                            variant="outline"
                            onClick={() => onDelete(problem.problem_id)}
                            disabled={deleting}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-colors"
                            title="Delete problem"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-3 ml-11">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        <Star className="w-3 h-3" />
                        {problem.score} pts
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        <Hash className="w-3 h-3" />
                        Rating {problem.rating}
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
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────
export default function ProblemsPage() {
    const { contestId } = useParams();
    const navigate = useNavigate();
    const formRef = useRef(null);

    const [contestTitle, setContestTitle] = useState('');
    const [problems, setProblems] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    // Fetch contest info + problems
    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const [contestRes, probRes] = await Promise.all([
                    api.get(`/contests/${contestId}`),
                    api.get(`/problems?contest_id=${contestId}`),
                ]);
                setContestTitle(contestRes.data.data?.title || '');
                setProblems(probRes.data.data || []);
            } catch (err) {
                toast.error(err?.response?.data?.message || 'Failed to load data.');
                navigate('/design-contest');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [contestId, navigate]);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (problem) => {
        setForm({
            title: problem.title || '',
            score: String(problem.score ?? ''),
            rating: String(problem.rating ?? ''),
            statement: problem.statement || '',
            explanation: problem.explanation || '',
            time_limit_ms: String(problem.time_limit_ms ?? 2000),
            memory_limit_mb: String(problem.memory_limit_mb ?? 256),
        });
        setEditingId(problem.problem_id);
        setShowForm(true);
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleCreateNew = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(true);
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleDelete = async (problemId) => {
        if (!confirm('Delete this problem? This cannot be undone.')) return;
        setDeletingId(problemId);
        try {
            await api.delete(`/problems/${problemId}`);
            toast.success('Problem deleted.');
            setProblems((prev) => prev.filter((p) => p.problem_id !== problemId));
            if (editingId === problemId) resetForm();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to delete problem.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return toast.error('Title is required.');
        if (form.score === '' || isNaN(Number(form.score))) return toast.error('Score is required.');
        if (Number(form.score) < 0 || Number(form.score) > 5000) return toast.error('Score must be 0–5000.');
        if (form.rating === '' || isNaN(Number(form.rating))) return toast.error('Rating is required.');
        if (!form.statement.trim()) return toast.error('Problem statement is required.');

        setSubmitting(true);
        try {
            const payload = {
                title: form.title,
                score: Number(form.score),
                rating: Number(form.rating),
                statement: form.statement,
                explanation: form.explanation || undefined,
                time_limit_ms: Number(form.time_limit_ms),
                memory_limit_mb: Number(form.memory_limit_mb),
            };

            if (editingId) {
                await api.patch(`/problems/${editingId}`, payload);
                toast.success('Problem updated.');
            } else {
                await api.post('/problems', { contest_id: Number(contestId), ...payload });
                toast.success('Problem created.');
            }

            // Refresh problems
            const res = await api.get(`/problems?contest_id=${contestId}`);
            setProblems(res.data.data || []);
            resetForm();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to save problem.');
        } finally {
            setSubmitting(false);
        }
    };

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
                        <div key={i} className="skeleton h-28 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card/50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                    <nav className="flex items-center mb-4">
                        <Link to="/design-contest" className="breadcrumb-link">My Contests</Link>
                        <span className="breadcrumb-sep">›</span>
                        <Link to={`/design-contest/contest/${contestId}`} className="breadcrumb-link">{contestTitle}</Link>
                        <span className="breadcrumb-sep">›</span>
                        <span className="text-sm text-foreground font-medium">Problems</span>
                    </nav>

                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
                                <BookOpen className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Problems
                                </h1>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {problems.length} problem{problems.length !== 1 ? 's' : ''} in "{contestTitle}"
                                </p>
                            </div>
                        </div>
                        <Button
                            id="create-new-problem"
                            onClick={handleCreateNew}
                            className="gap-2 shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            New Problem
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                {/* Problems list */}
                {problems.length === 0 && !showForm ? (
                    <div className="rounded-xl border border-dashed border-border py-16 text-center">
                        <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground mb-4">
                            No problems yet. Create your first one!
                        </p>
                        <Button onClick={handleCreateNew} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Create Problem
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {problems.map((problem, idx) => (
                            <ProblemCard
                                key={problem.problem_id}
                                problem={problem}
                                index={idx}
                                isEditing={editingId === problem.problem_id}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                deleting={deletingId === problem.problem_id}
                            />
                        ))}
                    </div>
                )}

                {/* Problem Form */}
                {showForm && (
                    <div ref={formRef} className="space-y-8 pt-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-foreground">
                                {editingId ? 'Edit Problem' : 'New Problem'}
                            </h2>
                            <button
                                onClick={resetForm}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                                Cancel
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Title */}
                            <section className="space-y-2">
                                <Label htmlFor="prob-title" className="text-sm font-semibold">
                                    Problem Title <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="prob-title"
                                    placeholder="e.g. Maximum Subarray Sum"
                                    value={form.title}
                                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                                    className="text-base h-11"
                                />
                            </section>

                            {/* Score, Rating, Limits */}
                            <section className="space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Constraints & Scoring
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="prob-score" className="text-sm flex items-center gap-1">
                                            <Star className="w-3.5 h-3.5 text-muted-foreground" />
                                            Score <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="prob-score"
                                            type="number"
                                            min={0}
                                            max={5000}
                                            placeholder="500"
                                            value={form.score}
                                            onChange={(e) => setForm((p) => ({ ...p, score: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="prob-rating" className="text-sm flex items-center gap-1">
                                            <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                                            Rating <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="prob-rating"
                                            type="number"
                                            min={0}
                                            placeholder="1400"
                                            value={form.rating}
                                            onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="prob-time" className="text-sm flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                            Time (ms)
                                        </Label>
                                        <Input
                                            id="prob-time"
                                            type="number"
                                            min={100}
                                            placeholder="2000"
                                            value={form.time_limit_ms}
                                            onChange={(e) => setForm((p) => ({ ...p, time_limit_ms: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="prob-mem" className="text-sm flex items-center gap-1">
                                            <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
                                            Memory (MB)
                                        </Label>
                                        <Input
                                            id="prob-mem"
                                            type="number"
                                            min={16}
                                            placeholder="256"
                                            value={form.memory_limit_mb}
                                            onChange={(e) => setForm((p) => ({ ...p, memory_limit_mb: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Problem Statement (Markdown) */}
                            <section className="space-y-3">
                                <div>
                                    <Label className="text-sm font-semibold">
                                        Problem Statement <span className="text-destructive">*</span>
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Full Markdown supported — use headers, bold, code blocks, LaTeX, tables, etc.
                                    </p>
                                </div>
                                <div data-color-mode="light">
                                    <MDEditor
                                        value={form.statement}
                                        onChange={(val) => setForm((p) => ({ ...p, statement: val || '' }))}
                                        height={320}
                                        preview="live"
                                        textareaProps={{
                                            placeholder: 'Write the full problem statement here…\n\n## Input\nThe first line contains an integer **n**…\n\n## Output\nPrint the answer…',
                                        }}
                                    />
                                </div>
                            </section>

                            {/* Explanation (Markdown, optional) */}
                            <section className="space-y-3">
                                <div>
                                    <Label className="text-sm font-semibold">
                                        Explanation / Editorial
                                        <span className="text-xs text-muted-foreground font-normal ml-2">(optional)</span>
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Approach walkthrough, complexity analysis, or editorial notes.
                                    </p>
                                </div>
                                <div data-color-mode="light">
                                    <MDEditor
                                        value={form.explanation}
                                        onChange={(val) => setForm((p) => ({ ...p, explanation: val || '' }))}
                                        height={200}
                                        preview="live"
                                        textareaProps={{
                                            placeholder: 'Explain the approach, key observations, and complexity…',
                                        }}
                                    />
                                </div>
                            </section>

                            {/* Submit buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    id="prob-submit"
                                    type="submit"
                                    disabled={submitting}
                                    className="gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {submitting
                                        ? (editingId ? 'Updating…' : 'Creating…')
                                        : (editingId ? 'Update Problem' : 'Create Problem')
                                    }
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Bottom navigation */}
                <div className="flex items-center justify-between pt-6 border-t border-border">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/design-contest')}
                        className="gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Save & Exit
                    </Button>
                    <Button
                        id="continue-to-testcases"
                        onClick={() => navigate(`/design-contest/testcases/${contestId}`)}
                        disabled={problems.length === 0}
                        className="gap-2"
                    >
                        Save & Continue
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
