import {useState, useEffect, useMemo} from 'react';
import {toast} from 'sonner';
import {
    Play,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Search,
    Calendar,
    Clock,
    ArrowUpDown,
    Trophy,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import api from '@/lib/axios';

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

function SkeletonRow() {
    return (
        <tr>
            <td className="px-4 py-4">
                <div className="skeleton h-5 w-48 rounded" />
            </td>
            <td className="px-4 py-4">
                <div className="skeleton h-5 w-16 rounded mx-auto" />
            </td>
            <td className="px-4 py-4">
                <div className="skeleton h-5 w-24 rounded mx-auto" />
            </td>
            <td className="px-4 py-4">
                <div className="skeleton h-6 w-20 rounded-full mx-auto" />
            </td>
            <td className="px-4 py-4">
                <div className="skeleton h-8 w-24 rounded mx-auto" />
            </td>
        </tr>
    );
}

export default function EvaluateContestsPage() {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending, running, completed, all
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState('end');
    const [sortDir, setSortDir] = useState('desc');
    const [evaluatingIds, setEvaluatingIds] = useState(new Set());

    const fetchContests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/contests');
            // Only keep contests that have ended
            const now = new Date();
            const ended = (res.data.data || []).filter(
                (c) => new Date(c.contest_end_time) < now
            );
            setContests(ended);
        } catch (err) {
            toast.error(
                err?.response?.data?.message || 'Failed to load ended contests.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContests();
    }, []);

    const handleEvaluate = async (contestId) => {
        setEvaluatingIds((prev) => {
            const next = new Set(prev);
            next.add(contestId);
            return next;
        });

        // Optimistically update status to 'running'
        setContests((prev) =>
            prev.map((c) =>
                c.id === contestId ? {...c, contest_evaluation: 'running'} : c
            )
        );

        try {
            const response = await api.post(`/contests/${contestId}/finalize`);
            toast.success(response.data?.message || 'Contest evaluation triggered successfully.');
            // Update status to 'completed'
            setContests((prev) =>
                prev.map((c) =>
                    c.id === contestId ? {...c, contest_evaluation: 'completed'} : c
                )
            );
        } catch (err) {
            toast.error(
                err?.response?.data?.message || 'Failed to trigger contest evaluation.'
            );
            // Revert status to 'pending'
            setContests((prev) =>
                prev.map((c) =>
                    c.id === contestId ? {...c, contest_evaluation: 'pending'} : c
                )
            );
        } finally {
            setEvaluatingIds((prev) => {
                const next = new Set(prev);
                next.delete(contestId);
                return next;
            });
        }
    };

    const toggleSort = (field) => {
        if (sortField === field) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const filteredAndSorted = useMemo(() => {
        let result = [...contests];

        if (search) {
            result = result.filter((c) =>
                c.title.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (filter !== 'all') {
            result = result.filter((c) => c.contest_evaluation === filter);
        }

        result.sort((a, b) => {
            let cmp = 0;
            if (sortField === 'title') {
                cmp = a.title.localeCompare(b.title);
            } else if (sortField === 'end') {
                cmp =
                    new Date(a.contest_end_time).getTime() -
                    new Date(b.contest_end_time).getTime();
            } else if (sortField === 'status') {
                cmp = (a.contest_evaluation || '').localeCompare(b.contest_evaluation || '');
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });

        return result;
    }, [contests, filter, search, sortField, sortDir]);

    const counts = {
        all: contests.length,
        pending: contests.filter((c) => c.contest_evaluation === 'pending').length,
        running: contests.filter((c) => c.contest_evaluation === 'running').length,
        completed: contests.filter((c) => c.contest_evaluation === 'completed').length,
    };

    const SortHeader = ({field, children, className = ''}) => (
        <th
            className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-foreground ${className}`}
            onClick={() => toggleSort(field)}
        >
            <span className="inline-flex items-center gap-1">
                {children}
                <ArrowUpDown
                    className={`w-3 h-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground/40'}`}
                />
            </span>
        </th>
    );

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b border-border bg-card/50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
                                <Trophy className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Admin: Evaluate Contests
                                </h1>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Trigger Elo rating updates and finalize results for ended contests.
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchContests}
                            disabled={loading}
                            className="gap-1.5"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 border-b border-border pb-0 w-full sm:w-auto overflow-x-auto">
                        {[
                            {key: 'pending', label: 'Pending'},
                            {key: 'running', label: 'Running'},
                            {key: 'completed', label: 'Completed'},
                            {key: 'all', label: 'All Ended'},
                        ].map(({key, label}) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`filter-tab text-sm font-medium px-3 py-2 whitespace-nowrap ${
                                    filter === key
                                        ? 'active text-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {label}
                                <span
                                    className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                                        filter === key
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {counts[key]}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search contests..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-xl border border-border overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/40">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                                        Contest
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                                        Division
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                                        End Time
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3].map((i) => (
                                    <SkeletonRow key={i} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : filteredAndSorted.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border py-16 text-center">
                        <CheckCircle2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            No ended contests found matching this status.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-border overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/40">
                                <tr>
                                    <SortHeader field="title" className="text-left">
                                        Contest
                                    </SortHeader>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Division
                                    </th>
                                    <SortHeader field="end" className="text-center">
                                        End Time
                                    </SortHeader>
                                    <SortHeader field="status" className="text-center">
                                        Status
                                    </SortHeader>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSorted.map((c) => {
                                    const isEvaluating = evaluatingIds.has(c.id) || c.contest_evaluation === 'running';
                                    return (
                                        <tr key={c.id} className="group border-b border-border transition-colors hover:bg-muted/30">
                                            {/* Contest details */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`div-badge-${c.division} flex items-center justify-center w-9 h-9 rounded-lg text-[11px] font-bold shrink-0`}>
                                                        D{c.division}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-foreground text-sm leading-tight truncate max-w-[300px]">
                                                            {c.title}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            By {c.authored_by_name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Division */}
                                            <td className="px-4 py-3.5 text-center">
                                                <span className="text-xs font-medium text-foreground">
                                                    Div. {c.division}
                                                </span>
                                            </td>

                                            {/* End time */}
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="text-sm text-foreground">
                                                    {formatDate(c.contest_end_time)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {formatTime(c.contest_end_time)}
                                                </div>
                                            </td>

                                            {/* Evaluation Status */}
                                            <td className="px-4 py-3.5 text-center">
                                                {c.contest_evaluation === 'completed' ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium px-2.5 py-1 bg-green-500/10 rounded-full">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Completed
                                                    </span>
                                                ) : c.contest_evaluation === 'running' ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium px-2.5 py-1 bg-blue-500/10 rounded-full">
                                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                        Evaluating
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium px-2.5 py-1 bg-amber-500/10 rounded-full">
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        Pending
                                                    </span>
                                                )}
                                            </td>

                                            {/* Action Button */}
                                            <td className="px-4 py-3.5 text-center">
                                                {c.contest_evaluation === 'pending' ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleEvaluate(c.id)}
                                                        disabled={isEvaluating}
                                                        className="gap-1.5 text-xs font-semibold px-4"
                                                    >
                                                        <Play className="w-3 h-3" />
                                                        {isEvaluating ? 'Evaluating...' : 'Evaluate'}
                                                    </Button>
                                                ) : c.contest_evaluation === 'running' ? (
                                                    <Button
                                                        size="sm"
                                                        disabled
                                                        variant="outline"
                                                        className="gap-1.5 text-xs px-4"
                                                    >
                                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                                        Running
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        disabled
                                                        variant="ghost"
                                                        className="gap-1.5 text-xs text-green-600 hover:text-green-600 hover:bg-transparent"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Finalized
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
