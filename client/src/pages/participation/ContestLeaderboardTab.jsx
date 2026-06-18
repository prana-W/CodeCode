import {useState, useEffect, useRef, useCallback} from 'react';
import {useParams, useOutletContext} from 'react-router-dom';
import {toast} from 'sonner';
import {Trophy, Loader2, RotateCw} from 'lucide-react';
import api from '@/lib/axios';
import {Button} from '@/components/ui/button';
import PaginationControls from '@/components/PaginationControls';

const PROBLEM_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PAGE_SIZE = 50;

export default function ContestLeaderboardTab() {
    const {id} = useParams();
    const {contest, problems} = useOutletContext();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    // Cache per page: Map<pageNum, { rows, pagination }>
    const cache = useRef(new Map());

    const fetchLeaderboard = useCallback(
        async (targetPage, isManual = false) => {
            // On manual refresh, flush the cache for all pages
            if (isManual) {
                cache.current.clear();
                setRefreshing(true);
            }

            if (!isManual && cache.current.has(targetPage)) {
                const cached = cache.current.get(targetPage);
                setLeaderboard(cached.rows);
                setPagination(cached.pagination);
                return;
            }

            try {
                const res = await api.get(`/contests/${id}/leaderboard`, {
                    params: {page: targetPage, limit: PAGE_SIZE},
                });
                const rows = res.data.data || [];
                const pag = res.data.pagination;
                cache.current.set(targetPage, {rows, pagination: pag});
                setLeaderboard(rows);
                setPagination(pag);
                if (isManual) toast.success('Leaderboard updated');
            } catch (err) {
                if (isManual) toast.error('Failed to update leaderboard');
            } finally {
                if (isManual) setRefreshing(false);
                setLoading(false);
            }
        },
        [id]
    );

    useEffect(() => {
        setLoading(true);
        cache.current.clear();
        setPage(1);
        fetchLeaderboard(1);

        const interval = setInterval(() => {
            // Auto-refresh: clear cache and refetch current page silently
            cache.current.clear();
            fetchLeaderboard(1);
        }, 60000);

        return () => clearInterval(interval);
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePrev = () => {
        const newPage = page - 1;
        setPage(newPage);
        fetchLeaderboard(newPage);
    };

    const handleNext = () => {
        const newPage = page + 1;
        setPage(newPage);
        fetchLeaderboard(newPage);
    };

    const rankOffset = (page - 1) * PAGE_SIZE;

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    if (leaderboard.length === 0) {
        return (
            <div className="text-center py-16 border border-dashed rounded-xl bg-card">
                <Trophy className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="font-semibold mb-1">No Participants Yet</h3>
                <p className="text-sm text-muted-foreground">
                    The leaderboard is empty for this contest.
                </p>
            </div>
        );
    }

    const showDelta = contest?.contest_evaluation === 'completed';

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-serif font-semibold tracking-tight text-foreground flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" /> Standings
                </h2>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setPage(1);
                        fetchLeaderboard(1, true);
                    }}
                    disabled={refreshing}
                    className="gap-2 text-xs font-semibold uppercase tracking-wider"
                >
                    <RotateCw
                        className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                    />
                    Refresh
                </Button>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="bg-muted/40 border-b border-border">
                        <tr>
                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center w-12 border-r border-border">
                                #
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-border min-w-[150px]">
                                Participant
                            </th>
                            {showDelta && (
                                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-border text-center w-20">
                                    Delta
                                </th>
                            )}
                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-border text-center w-20">
                                =
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-border text-center w-24">
                                Penalty
                            </th>
                            {problems.map((prob, idx) => (
                                <th
                                    key={prob.problem_id}
                                    className="px-4 py-3 text-xs font-bold text-primary uppercase tracking-wider text-center w-24 border-r border-border last:border-r-0"
                                >
                                    {PROBLEM_LETTERS[idx] || idx + 1}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {leaderboard.map((user, idx) => {
                            let solvedList = [];
                            try {
                                solvedList =
                                    typeof user.solved_problems === 'string'
                                        ? JSON.parse(user.solved_problems)
                                        : user.solved_problems || [];
                            } catch (e) {
                                solvedList = [];
                            }

                            const solvedMap = {};
                            solvedList.forEach((s) => {
                                if (s && s.problem_id) {
                                    solvedMap[s.problem_id] = s;
                                }
                            });

                            return (
                                <tr
                                    key={user.user_id}
                                    className="hover:bg-muted/30 transition-colors"
                                >
                                    <td className="px-4 py-3 text-center border-r border-border font-mono text-xs text-muted-foreground">
                                        {rankOffset + idx + 1}
                                    </td>
                                    <td className="px-4 py-3 border-r border-border">
                                        <div className="font-semibold text-foreground">
                                            {user.username}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {user.name}
                                        </div>
                                    </td>
                                    {showDelta && (
                                        <td className="px-4 py-3 text-center border-r border-border font-mono font-bold">
                                            <span
                                                className={
                                                    !user.delta ||
                                                    user.delta === 0
                                                        ? 'text-muted-foreground'
                                                        : user.delta > 0
                                                          ? 'text-emerald-500'
                                                          : 'text-red-500'
                                                }
                                            >
                                                {user.delta > 0
                                                    ? `+${user.delta}`
                                                    : user.delta || 0}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-4 py-3 text-center border-r border-border font-mono font-bold text-foreground">
                                        {user.final_score || 0}
                                    </td>
                                    <td className="px-4 py-3 text-center border-r border-border font-mono text-xs text-muted-foreground">
                                        {user.total_penalty_minutes || 0}
                                    </td>
                                    {problems.map((prob) => {
                                        const solvedData =
                                            solvedMap[prob.problem_id];
                                        return (
                                            <td
                                                key={prob.problem_id}
                                                className="px-4 py-3 text-center border-r border-border last:border-r-0"
                                            >
                                                {solvedData ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-emerald-500 font-bold font-mono text-sm">
                                                            +{solvedData.score}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                                            {
                                                                solvedData.penalty_minutes
                                                            }
                                                            m
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground/30 font-mono">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {pagination && (
                    <PaginationControls
                        currentPage={page}
                        totalPages={pagination.totalPages}
                        total={pagination.total}
                        limit={PAGE_SIZE}
                        onPrev={handlePrev}
                        onNext={handleNext}
                        loading={refreshing}
                    />
                )}
            </div>
        </div>
    );
}
