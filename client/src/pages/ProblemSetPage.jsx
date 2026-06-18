import {useState, useEffect, useRef, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {toast} from 'sonner';
import {
    Loader2,
    BookOpen,
    CheckCircle2,
    XCircle,
    Circle,
    SlidersHorizontal,
    EyeOff,
    Eye,
    ChevronUp,
    ChevronDown,
    Filter,
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import api from '@/lib/axios';
import PaginationControls from '@/components/PaginationControls';

const PAGE_SIZE = 50;
const LS_HIDE_SCORE_KEY = 'problemset_hide_score';
const SS_STATE_KEY = 'problemset_state'; // sessionStorage key for filter/page state

// Status metadata
const STATUS_CONFIG = {
    accepted: {
        label: 'Solved',
        icon: CheckCircle2,
        rowClass: 'text-emerald-600 dark:text-emerald-400',
        badgeClass:
            'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    attempted: {
        label: 'Attempted',
        icon: XCircle,
        rowClass: 'text-red-500 dark:text-red-400',
        badgeClass:
            'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20',
    },
    null: {
        label: 'Unsolved',
        icon: Circle,
        rowClass: 'text-foreground',
        badgeClass: 'bg-muted text-muted-foreground border-border',
    },
};

function getStatusConfig(status) {
    return STATUS_CONFIG[status] ?? STATUS_CONFIG['null'];
}

// Read persisted filter state from sessionStorage
function readPersistedState() {
    try {
        const raw = sessionStorage.getItem(SS_STATE_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return null;
}

// Write filter state to sessionStorage
function persistState(state) {
    try {
        sessionStorage.setItem(SS_STATE_KEY, JSON.stringify(state));
    } catch {}
}

export default function ProblemSetPage() {
    const navigate = useNavigate();

    // Restore state from sessionStorage on mount (so back-navigation keeps filters)
    const persisted = readPersistedState();

    // Filter state — restored from sessionStorage if available
    const [sortScore, setSortScore] = useState(persisted?.sortScore ?? 'desc');
    const [statusFilter, setStatusFilter] = useState(persisted?.statusFilter ?? 'all');
    const [contestFilter, setContestFilter] = useState(persisted?.contestFilter ?? 'all');
    const [page, setPage] = useState(persisted?.page ?? 1);

    // Data state
    const [problems, setProblems] = useState([]);
    const [allContests, setAllContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState(null);

    // Hide score: persisted to localStorage (intentional — persists across tabs/sessions)
    const [hideScore, setHideScore] = useState(() => {
        try {
            return localStorage.getItem(LS_HIDE_SCORE_KEY) === 'true';
        } catch {
            return false;
        }
    });

    const toggleHideScore = () => {
        setHideScore((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(LS_HIDE_SCORE_KEY, String(next));
            } catch {}
            return next;
        });
    };

    // Save filter/page state to sessionStorage whenever it changes
    useEffect(() => {
        persistState({sortScore, statusFilter, contestFilter, page});
    }, [sortScore, statusFilter, contestFilter, page]);

    // Page cache: Map keyed by "sortScore|statusFilter|contestFilter|page"
    const cache = useRef(new Map());

    const getCacheKey = (ss, sf, cf, p) => `${ss}|${sf}|${cf}|${p}`;

    const fetchProblems = useCallback(
        async (targetPage) => {
            const key = getCacheKey(
                sortScore,
                statusFilter,
                contestFilter,
                targetPage
            );
            if (cache.current.has(key)) {
                const cached = cache.current.get(key);
                setProblems(cached.problems);
                setPagination(cached.pagination);
                return;
            }

            setLoading(true);
            try {
                const res = await api.get('/problems/problemset', {
                    params: {page: targetPage, limit: PAGE_SIZE},
                });
                const rawProblems = res.data.data || [];
                const pag = res.data.pagination;

                // Collect unique contest names for the dropdown (page 1 only)
                if (targetPage === 1 && allContests.length === 0) {
                    const seen = new Map();
                    rawProblems.forEach((p) => {
                        if (!seen.has(p.contest_id)) {
                            seen.set(p.contest_id, p.contest_title);
                        }
                    });
                    setAllContests(
                        [...seen.entries()].map(([id, title]) => ({id, title}))
                    );
                }

                cache.current.set(key, {problems: rawProblems, pagination: pag});
                setProblems(rawProblems);
                setPagination(pag);
            } catch (err) {
                toast.error(
                    err?.response?.data?.message || 'Failed to fetch problems'
                );
            } finally {
                setLoading(false);
            }
        },
        [sortScore, statusFilter, contestFilter, allContests.length]
    );

    // On filter change reset to page 1 and clear cache
    useEffect(() => {
        cache.current.clear();
        setPage(1);
        fetchProblems(1);
    }, [sortScore, statusFilter, contestFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    // On first mount if a page was saved (back-navigation), restore it
    const didRestorePage = useRef(false);
    useEffect(() => {
        if (!didRestorePage.current && persisted?.page && persisted.page > 1) {
            didRestorePage.current = true;
            // Cache was cleared by the filter effect above; refetch the restored page
            fetchProblems(persisted.page);
            setPage(persisted.page);
        }
        didRestorePage.current = true;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePrev = () => {
        const newPage = page - 1;
        setPage(newPage);
        fetchProblems(newPage);
    };

    const handleNext = () => {
        const newPage = page + 1;
        setPage(newPage);
        fetchProblems(newPage);
    };

    // Client-side filtering + sorting applied on top of the fetched page
    const displayedProblems = problems
        .filter((p) => {
            if (statusFilter === 'all') return true;
            if (statusFilter === 'accepted') return p.user_status === 'accepted';
            if (statusFilter === 'attempted') return p.user_status === 'attempted';
            if (statusFilter === 'unsolved') return p.user_status === null;
            return true;
        })
        .filter((p) => {
            if (contestFilter === 'all') return true;
            return String(p.contest_id) === String(contestFilter);
        })
        .sort((a, b) =>
            sortScore === 'desc' ? b.score - a.score : a.score - b.score
        );

    // Navigate to problem, passing ?from=problemset so the back button knows where to go
    const handleProblemClick = (problem) => {
        navigate(
            `/contest/${problem.contest_id}/problem/${problem.problem_id}?from=problemset`
        );
    };

    const solvedCount = problems.filter((p) => p.user_status === 'accepted').length;
    const attemptedCount = problems.filter((p) => p.user_status === 'attempted').length;

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                            <BookOpen className="w-8 h-8 text-primary" />
                            Problem Set
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm font-medium">
                            Practice problems from all completed verified
                            contests
                        </p>
                        {/* Quick stats */}
                        {!loading && pagination && (
                            <div className="flex items-center gap-4 mt-3">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground">
                                    <BookOpen className="w-3 h-3" />
                                    {pagination.total} problems
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {solvedCount} solved
                                </span>
                                {attemptedCount > 0 && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400">
                                        <XCircle className="w-3 h-3" />
                                        {attemptedCount} attempted
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-2 rounded-lg border border-border">
                        {/* Sort by score — wider to fit "Score: High → Low" on one line */}
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />
                            <Select value={sortScore} onValueChange={setSortScore}>
                                <SelectTrigger
                                    id="sort-score"
                                    className="w-[185px] bg-card border-border text-sm whitespace-nowrap"
                                >
                                    <SelectValue placeholder="Sort by score" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="desc">
                                        <span className="flex items-center gap-2 whitespace-nowrap">
                                            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                                            Score: High → Low
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="asc">
                                        <span className="flex items-center gap-2 whitespace-nowrap">
                                            <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                                            Score: Low → High
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger
                                    id="filter-status"
                                    className="w-[140px] bg-card border-border text-sm"
                                >
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="accepted">Solved</SelectItem>
                                    <SelectItem value="attempted">Attempted</SelectItem>
                                    <SelectItem value="unsolved">Unsolved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Contest filter */}
                        {allContests.length > 0 && (
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                                <Select
                                    value={contestFilter}
                                    onValueChange={setContestFilter}
                                >
                                    <SelectTrigger
                                        id="filter-contest"
                                        className="w-[200px] bg-card border-border text-sm"
                                    >
                                        <SelectValue placeholder="Contest" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Contests</SelectItem>
                                        {allContests.map((c) => (
                                            <SelectItem
                                                key={c.id}
                                                value={String(c.id)}
                                            >
                                                {c.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Hide score toggle */}
                        <Button
                            id="toggle-hide-score"
                            variant={hideScore ? 'default' : 'outline'}
                            size="sm"
                            className="gap-2 text-xs font-semibold h-9"
                            onClick={toggleHideScore}
                        >
                            {hideScore ? (
                                <>
                                    <Eye className="w-3.5 h-3.5" />
                                    Show Score
                                </>
                            ) : (
                                <>
                                    <EyeOff className="w-3.5 h-3.5" />
                                    Hide Score
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Problems Table */}
                <Card className="border-border shadow-sm overflow-hidden bg-card">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50 border-b border-border">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-10 text-center font-bold text-muted-foreground uppercase text-xs tracking-wider">
                                            #
                                        </TableHead>
                                        <TableHead className="font-bold text-muted-foreground uppercase text-xs tracking-wider">
                                            Problem
                                        </TableHead>
                                        <TableHead className="font-bold text-muted-foreground uppercase text-xs tracking-wider hidden sm:table-cell">
                                            Contest
                                        </TableHead>
                                        <TableHead className="w-24 text-center font-bold text-muted-foreground uppercase text-xs tracking-wider">
                                            Status
                                        </TableHead>
                                        {!hideScore && (
                                            <TableHead className="w-24 text-right font-bold text-muted-foreground uppercase text-xs tracking-wider">
                                                Score
                                            </TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={hideScore ? 4 : 5}
                                                className="h-48 text-center"
                                            >
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                                    <p className="text-sm text-muted-foreground">
                                                        Loading problems...
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : displayedProblems.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={hideScore ? 4 : 5}
                                                className="h-48 text-center"
                                            >
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <BookOpen className="w-8 h-8 text-muted-foreground/30" />
                                                    <p className="text-muted-foreground font-medium text-sm">
                                                        No problems match the
                                                        current filters.
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        displayedProblems.map((problem, idx) => {
                                            const cfg = getStatusConfig(
                                                problem.user_status
                                            );
                                            const StatusIcon = cfg.icon;
                                            const globalIdx =
                                                (page - 1) * PAGE_SIZE + idx + 1;

                                            return (
                                                <TableRow
                                                    key={problem.problem_id}
                                                    id={`problem-row-${problem.problem_id}`}
                                                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                                                    onClick={() =>
                                                        handleProblemClick(problem)
                                                    }
                                                >
                                                    <TableCell className="text-center font-mono text-xs text-muted-foreground font-semibold">
                                                        {globalIdx}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`font-semibold text-sm ${cfg.rowClass}`}
                                                        >
                                                            {problem.title}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm text-muted-foreground font-medium truncate max-w-[220px]">
                                                                {problem.contest_title}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider mt-0.5">
                                                                Div. {problem.division}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span
                                                            className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}
                                                        >
                                                            <StatusIcon className="w-3 h-3" />
                                                            {cfg.label}
                                                        </span>
                                                    </TableCell>
                                                    {!hideScore && (
                                                        <TableCell className="text-right">
                                                            <span className="font-extrabold text-sm text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                                                                {problem.score}
                                                            </span>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {pagination && (
                            <PaginationControls
                                currentPage={page}
                                totalPages={pagination.totalPages}
                                total={pagination.total}
                                limit={PAGE_SIZE}
                                onPrev={handlePrev}
                                onNext={handleNext}
                                loading={loading}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
