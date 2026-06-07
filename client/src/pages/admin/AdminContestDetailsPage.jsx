import {useState, useEffect} from 'react';
import {useParams, useNavigate, Link} from 'react-router-dom';
import {toast} from 'sonner';
import {
    ShieldCheck,
    Calendar,
    Clock,
    Trophy,
    CheckCircle,
    XCircle,
    ArrowLeft,
    Loader2,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import api from '@/lib/axios';

const PROBLEM_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// ─── Problem Testcases Panel ─────────────────────────────────────────────
function AdminProblemPanel({problem, index}) {
    const [testcases, setTestcases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const fetchTestcases = async () => {
            setLoading(true);
            try {
                const res = await api.get(
                    `/testcases?problem_id=${problem.problem_id}`
                );
                setTestcases(res.data.data || []);
            } catch (err) {
                setError('Failed to load test cases.');
            } finally {
                setLoading(false);
            }
        };
        fetchTestcases();
    }, [problem.problem_id, open]);

    return (
        <div className="border border-border rounded-xl bg-card overflow-hidden">
            <button
                className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors focus:outline-none"
                onClick={() => setOpen(!open)}
            >
                <div className="flex items-center gap-3">
                    <div className="problem-letter w-7 h-7 text-xs">
                        {PROBLEM_LETTERS[index] || index + 1}
                    </div>
                    <span className="font-semibold text-sm">
                        {problem.title}
                    </span>
                </div>
                <div className="flex gap-2">
                    <span className="text-xs text-muted-foreground">
                        {problem.score} pts
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {problem.time_limit_ms}ms
                    </span>
                </div>
            </button>

            {open && (
                <div className="p-4 border-t border-border space-y-4">
                    <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                            Statement
                        </h4>
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                            {problem.statement}
                        </div>
                    </div>
                    {problem.explanation && (
                        <div>
                            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                                Explanation
                            </h4>
                            <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                                {problem.explanation}
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                            Test Cases
                        </h4>
                        {loading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />{' '}
                                Loading test cases...
                            </div>
                        ) : error ? (
                            <div className="text-sm text-destructive">
                                {error}
                            </div>
                        ) : testcases.length === 0 ? (
                            <div className="text-sm text-muted-foreground">
                                No test cases found.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {testcases.map((tc, tcIdx) => (
                                    <div
                                        key={tc.test_case_id}
                                        className="grid grid-cols-2 gap-3 border border-border rounded-lg p-3 bg-muted/20"
                                    >
                                        <div>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                                                Input{' '}
                                                {tc.is_sample ? '(Sample)' : ''}
                                            </p>
                                            <pre className="text-xs font-mono bg-muted p-2 rounded max-h-32 overflow-auto whitespace-pre-wrap">
                                                {tc.input_data}
                                            </pre>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                                                Expected Output
                                            </p>
                                            <pre className="text-xs font-mono bg-muted p-2 rounded max-h-32 overflow-auto whitespace-pre-wrap">
                                                {tc.expected_output}
                                            </pre>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────
export default function AdminContestDetailsPage() {
    const {id} = useParams();
    const navigate = useNavigate();
    const [contest, setContest] = useState(null);
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const contestRes = await api.get(`/contests/${id}`);
                setContest(contestRes.data.data);

                try {
                    const probRes = await api.get(`/problems?contest_id=${id}`);
                    setProblems(probRes.data.data || []);
                } catch (probErr) {
                    // API returns 404 or empty if no problems, handle gracefully
                    setProblems([]);
                }
            } catch (err) {
                toast.error(
                    err?.response?.data?.message ||
                        'Failed to load contest details.'
                );
                navigate('/admin/verify-contests');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id, navigate]);

    const toggleVerify = async () => {
        if (
            !confirm(
                `Are you sure you want to ${contest.isVerified ? 'unverify' : 'verify'} this contest?`
            )
        )
            return;
        setVerifying(true);
        try {
            const res = await api.patch(`/contests/${id}/verify`);
            setContest(res.data.data);
            toast.success(
                `Contest ${contest.isVerified ? 'unverified' : 'verified'} successfully.`
            );
        } catch (err) {
            toast.error(
                err?.response?.data?.message ||
                    'Failed to update contest status.'
            );
        } finally {
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">
                    Loading contest details...
                </p>
            </div>
        );
    }

    if (!contest) return null;

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b border-border bg-card/50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 border-b border-border">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/admin/verify-contests')}
                        className="gap-2 -ml-3 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Contests
                    </Button>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div
                                className={`div-badge-${contest.division} flex items-center justify-center w-12 h-12 rounded-xl text-sm font-bold shrink-0`}
                            >
                                D{contest.division}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    {contest.title}
                                </h1>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    By {contest.authored_by_name}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={toggleVerify}
                            disabled={verifying}
                            variant={
                                contest.isVerified ? 'destructive' : 'default'
                            }
                            className="gap-2"
                        >
                            {contest.isVerified ? (
                                <XCircle className="w-4 h-4" />
                            ) : (
                                <CheckCircle className="w-4 h-4" />
                            )}
                            {verifying
                                ? 'Updating...'
                                : contest.isVerified
                                  ? 'Unverify Contest'
                                  : 'Verify Contest'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                {/* Contest Metadata */}
                <section className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                Start Time
                            </span>
                        </div>
                        <div className="font-medium">
                            {new Date(
                                contest.contest_start_time
                            ).toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                End Time
                            </span>
                        </div>
                        <div className="font-medium">
                            {new Date(
                                contest.contest_end_time
                            ).toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                Status
                            </span>
                        </div>
                        <div
                            className={`font-medium ${contest.isVerified ? 'text-green-600' : 'text-amber-600'}`}
                        >
                            {contest.isVerified
                                ? 'Verified'
                                : 'Unverified (Pending Review)'}
                        </div>
                    </div>
                </section>

                {contest.description && (
                    <section className="bg-card border border-border rounded-xl p-5 space-y-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Description
                        </h3>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                            {contest.description}
                        </p>
                    </section>
                )}

                {/* Problems List */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                        <Trophy className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold">
                            Problems ({problems.length})
                        </h2>
                    </div>

                    {problems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-xl">
                            This contest has no problems yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {problems.map((prob, idx) => (
                                <AdminProblemPanel
                                    key={prob.problem_id}
                                    problem={prob}
                                    index={idx}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
