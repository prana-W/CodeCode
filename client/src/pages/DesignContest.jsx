import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Trophy, BookOpen, FlaskConical,
    Check, ChevronRight, Plus, Trash2,
    Clock, Cpu, Hash, Star, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select';
import api from '@/lib/axios';

// ─── Step indicator ──────────────────────────────────────────────────────────
const STEPS = [
    { label: 'Contest Info', Icon: Trophy },
    { label: 'Add Problems', Icon: BookOpen },
    { label: 'Test Cases',   Icon: FlaskConical },
];

function Stepper({ current }) {
    return (
        <div className="flex items-center gap-0">
            {STEPS.map(({ label, Icon }, idx) => {
                const done    = idx < current;
                const active  = idx === current;
                return (
                    <div key={label} className="flex items-center">
                        <div className="flex flex-col items-center gap-1">
                            <div className={[
                                'flex items-center justify-center w-9 h-9 rounded-full border-2 transition-colors',
                                done   ? 'bg-primary border-primary text-primary-foreground'
                                       : active ? 'border-primary text-primary bg-primary/5'
                                                : 'border-border text-muted-foreground bg-background',
                            ].join(' ')}>
                                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                            </div>
                            <span className={[
                                'text-xs font-medium whitespace-nowrap',
                                active ? 'text-foreground' : 'text-muted-foreground',
                            ].join(' ')}>{label}</span>
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div className={[
                                'h-px w-16 sm:w-24 mx-2 mb-4 transition-colors',
                                done ? 'bg-primary' : 'bg-border',
                            ].join(' ')} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Step 1: Contest Info ────────────────────────────────────────────────────
function StepContest({ onCreated }) {
    const [form, setForm] = useState({
        title: '', description: '', division: '',
        contest_start_time: '', contest_end_time: '',
    });
    const [loading, setLoading] = useState(false);

    const set = (field) => (e) =>
        setForm((p) => ({ ...p, [field]: e.target?.value ?? e }));

    const submit = async (e) => {
        e.preventDefault();
        const { title, division, contest_start_time, contest_end_time } = form;
        if (!title || !division || !contest_start_time || !contest_end_time) {
            toast.error('Please fill in all required fields.');
            return;
        }
        if (new Date(contest_start_time) >= new Date(contest_end_time)) {
            toast.error('Start time must be before end time.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/contests', {
                ...form, division: Number(division),
            });
            const contest = res.data.data;
            toast.success(`Contest "${contest.title}" created!`);
            onCreated(contest);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to create contest.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            <Field label="Contest Title *" id="contest-title">
                <Input id="contest-title" placeholder="e.g. Codeforces Round #900" value={form.title} onChange={set('title')} />
            </Field>

            <Field label="Description" id="contest-desc">
                <Textarea id="contest-desc" rows={3} placeholder="Optional overview of the contest…" value={form.description} onChange={set('description')} />
            </Field>

            <Field label="Division *" id="contest-division">
                <Select onValueChange={set('division')} value={form.division}>
                    <SelectTrigger id="contest-division">
                        <SelectValue placeholder="Select division (1 – 5)" />
                    </SelectTrigger>
                    <SelectContent>
                        {[1,2,3,4,5].map((d) => (
                            <SelectItem key={d} value={String(d)}>Division {d}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Start Time *" id="contest-start">
                    <Input id="contest-start" type="datetime-local" value={form.contest_start_time} onChange={set('contest_start_time')} />
                </Field>
                <Field label="End Time *" id="contest-end">
                    <Input id="contest-end" type="datetime-local" value={form.contest_end_time} onChange={set('contest_end_time')} />
                </Field>
            </div>

            <div className="flex justify-end pt-2">
                <Button id="step1-next" type="submit" disabled={loading} className="gap-2">
                    {loading ? 'Creating…' : 'Create & Continue'}
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </form>
    );
}

// ─── Step 2: Add Problems ────────────────────────────────────────────────────
const EMPTY_PROBLEM = {
    title: '', score: '', rating: '',
    statement: '', explanation: '',
    time_limit_ms: '2000', memory_limit_mb: '256',
};

function StepProblems({ contest, problems, setProblems, onNext }) {
    const [form, setForm]     = useState(EMPTY_PROBLEM);
    const [loading, setLoading] = useState(false);

    const set = (field) => (e) =>
        setForm((p) => ({ ...p, [field]: e.target?.value ?? e }));

    const addProblem = async (e) => {
        e.preventDefault();
        const { title, score, rating, statement } = form;
        if (!title || score === '' || rating === '' || !statement) {
            toast.error('Title, score, rating and statement are required.');
            return;
        }
        if (Number(score) < 0 || Number(score) > 5000) {
            toast.error('Score must be between 0 and 5000.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/problems', {
                contest_id: contest.id,
                title,
                score: Number(score),
                rating: Number(rating),
                statement,
                explanation: form.explanation || undefined,
                time_limit_ms: Number(form.time_limit_ms),
                memory_limit_mb: Number(form.memory_limit_mb),
            });
            toast.success(`Problem "${form.title}" added.`);
            setProblems((p) => [...p, res.data.data]);
            setForm(EMPTY_PROBLEM);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to add problem.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Added problems list */}
            {problems.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Added Problems ({problems.length})</p>
                    <div className="space-y-2">
                        {problems.map((p, i) => (
                            <div key={p.problem_id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-muted/40">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">{i + 1}</span>
                                <span className="font-medium text-sm text-foreground flex-1">{p.title}</span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3" />{p.score} pts</span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1"><Hash className="w-3 h-3" />Rating {p.rating}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add problem form */}
            <form onSubmit={addProblem} className="space-y-4 p-4 rounded-xl border border-dashed border-border bg-muted/20">
                <p className="text-sm font-semibold text-foreground">
                    {problems.length === 0 ? 'Add your first problem' : 'Add another problem'}
                </p>

                <Field label="Problem Title *" id="prob-title">
                    <Input id="prob-title" placeholder="e.g. Sum of Digits" value={form.title} onChange={set('title')} />
                </Field>

                <div className="grid sm:grid-cols-3 gap-4">
                    <Field label="Score (0–5000) *" id="prob-score">
                        <div className="relative">
                            <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input id="prob-score" type="number" min={0} max={5000} placeholder="500" value={form.score} onChange={set('score')} className="pl-9" />
                        </div>
                    </Field>
                    <Field label="Difficulty Rating *" id="prob-rating">
                        <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input id="prob-rating" type="number" min={0} placeholder="1400" value={form.rating} onChange={set('rating')} className="pl-9" />
                        </div>
                    </Field>
                    <div className="grid grid-cols-2 gap-2">
                        <Field label="Time (ms)" id="prob-time">
                            <div className="relative">
                                <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                <Input id="prob-time" type="number" min={100} placeholder="2000" value={form.time_limit_ms} onChange={set('time_limit_ms')} className="pl-8 text-sm" />
                            </div>
                        </Field>
                        <Field label="Mem (MB)" id="prob-mem">
                            <div className="relative">
                                <Cpu className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                <Input id="prob-mem" type="number" min={16} placeholder="256" value={form.memory_limit_mb} onChange={set('memory_limit_mb')} className="pl-8 text-sm" />
                            </div>
                        </Field>
                    </div>
                </div>

                <Field label="Problem Statement (Markdown) *" id="prob-statement">
                    <MarkdownEditor
                        id="prob-statement"
                        value={form.statement}
                        onChange={(val) => setForm((p) => ({ ...p, statement: val }))}
                        placeholder="Describe the problem in full. Supports **Markdown**."
                        rows={8}
                    />
                </Field>

                <Field label="Explanation / Editorial (Markdown, optional)" id="prob-explanation">
                    <MarkdownEditor
                        id="prob-explanation"
                        value={form.explanation}
                        onChange={(val) => setForm((p) => ({ ...p, explanation: val }))}
                        placeholder="Optional editorial or approach explanation…"
                        rows={5}
                    />
                </Field>

                <div className="flex justify-end">
                    <Button id="add-problem-btn" type="submit" disabled={loading} variant="outline" className="gap-2">
                        <Plus className="w-4 h-4" />
                        {loading ? 'Adding…' : 'Add Problem'}
                    </Button>
                </div>
            </form>

            <div className="flex justify-between items-center pt-2">
                <p className="text-sm text-muted-foreground">
                    {problems.length === 0
                        ? 'Add at least one problem to continue.'
                        : `${problems.length} problem(s) ready.`}
                </p>
                <Button
                    id="step2-next"
                    onClick={onNext}
                    disabled={problems.length === 0}
                    className="gap-2"
                >
                    Continue to Test Cases
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

// ─── Step 3: Test Cases ──────────────────────────────────────────────────────
const EMPTY_TC = { input_data: '', expected_output: '', is_sample: false };

function TestCasePanel({ problem }) {
    const [open, setOpen]       = useState(false);
    const [form, setForm]       = useState(EMPTY_TC);
    const [added, setAdded]     = useState([]);
    const [loading, setLoading] = useState(false);

    const set = (field) => (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm((p) => ({ ...p, [field]: val }));
    };

    const addTC = async (e) => {
        e.preventDefault();
        if (!form.input_data || !form.expected_output) {
            toast.error('Input and expected output are required.');
            return;
        }
        setLoading(true);
        try {
            await api.post('/testcases', {
                problem_id: problem.problem_id,
                input_data: form.input_data,
                expected_output: form.expected_output,
                is_sample: form.is_sample,
            });
            toast.success('Test case added.');
            setAdded((p) => [...p, { ...form, id: Date.now() }]);
            setForm(EMPTY_TC);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to add test case.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-xl border border-border overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm text-foreground">{problem.title}</span>
                    {added.length > 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            {added.length} TC{added.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {open && (
                <div className="p-4 space-y-4">
                    {/* Added list */}
                    {added.length > 0 && (
                        <div className="space-y-2">
                            {added.map((tc, i) => (
                                <div key={tc.id} className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 text-xs font-mono">
                                    <span className="text-muted-foreground mt-0.5">#{i + 1}</span>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <p className="truncate"><span className="text-muted-foreground">in:</span> {tc.input_data}</p>
                                        <p className="truncate"><span className="text-muted-foreground">out:</span> {tc.expected_output}</p>
                                    </div>
                                    {tc.is_sample && (
                                        <span className="shrink-0 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded">sample</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <form onSubmit={addTC} className="space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                            <Field label="Input Data *" id={`tc-input-${problem.problem_id}`}>
                                <Textarea
                                    id={`tc-input-${problem.problem_id}`}
                                    rows={4}
                                    placeholder={"3\n1 2 3"}
                                    value={form.input_data}
                                    onChange={set('input_data')}
                                    className="font-mono text-sm"
                                />
                            </Field>
                            <Field label="Expected Output *" id={`tc-output-${problem.problem_id}`}>
                                <Textarea
                                    id={`tc-output-${problem.problem_id}`}
                                    rows={4}
                                    placeholder={"6"}
                                    value={form.expected_output}
                                    onChange={set('expected_output')}
                                    className="font-mono text-sm"
                                />
                            </Field>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                            <input
                                type="checkbox"
                                id={`tc-sample-${problem.problem_id}`}
                                checked={form.is_sample}
                                onChange={set('is_sample')}
                                className="rounded border-border accent-primary"
                            />
                            <span className="text-sm text-foreground">Mark as sample test case (visible to contestants)</span>
                        </label>

                        <div className="flex justify-end">
                            <Button id={`add-tc-${problem.problem_id}`} type="submit" disabled={loading} variant="outline" size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                {loading ? 'Adding…' : 'Add Test Case'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

function StepTestCases({ problems, onFinish }) {
    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Expand each problem to add test cases. At least one test case per problem is recommended.
            </p>
            {problems.map((p) => (
                <TestCasePanel key={p.problem_id} problem={p} />
            ))}
            <div className="flex justify-end pt-2">
                <Button id="finish-btn" onClick={onFinish} className="gap-2">
                    <Check className="w-4 h-4" />
                    Finish & Publish
                </Button>
            </div>
        </div>
    );
}

// ─── Simple markdown editor (textarea + preview tabs) ────────────────────────
function MarkdownEditor({ id, value, onChange, placeholder, rows = 6 }) {
    const [tab, setTab] = useState('write');
    return (
        <div className="rounded-lg border border-border overflow-hidden">
            <div className="flex border-b border-border bg-muted/30">
                {['write', 'preview'].map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={[
                            'px-4 py-1.5 text-xs font-medium capitalize transition-colors',
                            tab === t
                                ? 'bg-background text-foreground border-b-2 border-primary'
                                : 'text-muted-foreground hover:text-foreground',
                        ].join(' ')}
                    >
                        {t}
                    </button>
                ))}
            </div>
            {tab === 'write' ? (
                <Textarea
                    id={id}
                    rows={rows}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="rounded-none border-0 font-mono text-sm resize-y focus-visible:ring-0"
                />
            ) : (
                <div
                    className="min-h-[6rem] p-3 prose prose-sm max-w-none text-foreground text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                        __html: value
                            ? value
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>')
                                .replace(/\n/g, '<br />')
                            : '<span class="text-muted-foreground italic">Nothing to preview</span>',
                    }}
                />
            )}
        </div>
    );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, id, children }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
            {children}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DesignContest() {
    const navigate  = useNavigate();
    const [step, setStep]       = useState(0);
    const [contest, setContest] = useState(null);
    const [problems, setProblems] = useState([]);

    const handleContestCreated = (c) => {
        setContest(c);
        setStep(1);
    };

    const handleFinish = () => {
        toast.success('🎉 Contest published successfully!', {
            description: `"${contest?.title}" is now pending admin review.`,
        });
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Page header */}
            <div className="border-b border-border bg-muted/20">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Design a Contest</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create a contest, add problems with full statements, and attach test cases — step by step.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                {/* Stepper */}
                <div className="flex justify-center">
                    <Stepper current={step} />
                </div>

                {/* Contest info banner (Steps 2+) */}
                {contest && step > 0 && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                        <Trophy className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-foreground font-medium">{contest.title}</span>
                        <span className="text-muted-foreground">· Division {contest.division}</span>
                        <span className="ml-auto text-xs text-muted-foreground">ID #{contest.id}</span>
                    </div>
                )}

                {/* Step panels */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    {step === 0 && <StepContest onCreated={handleContestCreated} />}
                    {step === 1 && (
                        <StepProblems
                            contest={contest}
                            problems={problems}
                            setProblems={setProblems}
                            onNext={() => setStep(2)}
                        />
                    )}
                    {step === 2 && (
                        <StepTestCases
                            problems={problems}
                            onFinish={handleFinish}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
