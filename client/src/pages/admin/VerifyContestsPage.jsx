import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    ShieldCheck, Calendar, Clock, ChevronRight,
    Search, ArrowUpDown, Filter, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/axios';

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}

// ─── Skeleton Row ────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr>
            <td className="px-4 py-4"><div className="skeleton h-5 w-48 rounded" /></td>
            <td className="px-4 py-4"><div className="skeleton h-5 w-16 rounded mx-auto" /></td>
            <td className="px-4 py-4"><div className="skeleton h-5 w-24 rounded mx-auto" /></td>
            <td className="px-4 py-4"><div className="skeleton h-6 w-20 rounded-full mx-auto" /></td>
            <td className="px-4 py-4"><div className="skeleton h-8 w-24 rounded mx-auto" /></td>
        </tr>
    );
}

// ─── Contest Row ─────────────────────────────────────────────────────────
function ContestRow({ contest }) {
    const navigate = useNavigate();

    return (
        <tr className="group border-b border-border transition-colors hover:bg-muted/30">
            {/* Title + Author */}
            <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                    <div className={`div-badge-${contest.division} flex items-center justify-center w-9 h-9 rounded-lg text-[11px] font-bold shrink-0`}>
                        D{contest.division}
                    </div>
                    <div className="min-w-0">
                        <div className="font-semibold text-foreground text-sm leading-tight truncate max-w-[300px]">
                            {contest.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            By {contest.authored_by_name}
                        </div>
                    </div>
                </div>
            </td>

            {/* Division */}
            <td className="px-4 py-3.5 text-center">
                <span className="text-xs font-medium text-foreground">
                    Div. {contest.division}
                </span>
            </td>

            {/* Start Time */}
            <td className="px-4 py-3.5 text-center">
                <div className="text-sm text-foreground">{formatDate(contest.contest_start_time)}</div>
                <div className="text-xs text-muted-foreground">{formatTime(contest.contest_start_time)}</div>
            </td>

            {/* Status */}
            <td className="px-4 py-3.5 text-center">
                {contest.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium px-2 py-1 bg-green-500/10 rounded-md">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium px-2 py-1 bg-amber-500/10 rounded-md">
                        <Filter className="w-3 h-3" />
                        Unverified
                    </span>
                )}
            </td>

            {/* Action */}
            <td className="px-4 py-3.5 text-center">
                <Button
                    size="sm"
                    variant={contest.isVerified ? "outline" : "default"}
                    onClick={() => navigate(`/admin/verify-contests/${contest.id}`)}
                    className="gap-1.5 text-xs"
                >
                    {contest.isVerified ? (
                        <>
                            <Eye className="w-3 h-3" /> View
                        </>
                    ) : (
                        <>
                            Review <ChevronRight className="w-3 h-3" />
                        </>
                    )}
                </Button>
            </td>
        </tr>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────
export default function VerifyContestsPage() {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState('nearest');
    const [sortDir, setSortDir] = useState('asc');

    useEffect(() => {
        const fetchContests = async () => {
            setLoading(true);
            try {
                const res = await api.get('/contests');
                setContests(res.data.data || []);
            } catch (err) {
                toast.error(err?.response?.data?.message || 'Failed to load contests.');
            } finally {
                setLoading(false);
            }
        };
        fetchContests();
    }, []);

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
            result = result.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
        }

        if (filter === 'verified') {
            result = result.filter(c => c.isVerified);
        } else if (filter === 'unverified') {
            result = result.filter(c => !c.isVerified);
        }

        const now = Date.now();

        result.sort((a, b) => {
            let cmp = 0;
            if (sortField === 'nearest') {
                const diffA = Math.abs(new Date(a.contest_start_time).getTime() - now);
                const diffB = Math.abs(new Date(b.contest_start_time).getTime() - now);
                cmp = diffA - diffB;
            } else if (sortField === 'title') {
                cmp = a.title.localeCompare(b.title);
            } else if (sortField === 'start') {
                cmp = new Date(a.contest_start_time).getTime() - new Date(b.contest_start_time).getTime();
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });

        return result;
    }, [contests, filter, search, sortField, sortDir]);

    const counts = {
        all: contests.length,
        verified: contests.filter(c => c.isVerified).length,
        unverified: contests.filter(c => !c.isVerified).length,
    };

    const SortHeader = ({ field, children, className = '' }) => (
        <th
            className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-foreground ${className}`}
            onClick={() => toggleSort(field)}
        >
            <span className="inline-flex items-center gap-1">
                {children}
                <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground/40'}`} />
            </span>
        </th>
    );

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b border-border bg-card/50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
                            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Admin: Verify Contests
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Review and approve newly created contests before they are visible to the public.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 border-b border-border pb-0 w-full sm:w-auto overflow-x-auto">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'unverified', label: 'Unverified' },
                            { key: 'verified', label: 'Verified' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`filter-tab text-sm font-medium px-3 py-2 whitespace-nowrap ${
                                    filter === key ? 'active text-primary' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {label}
                                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                                    filter === key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                }`}>
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
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Contest</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Division</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Start Time</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
                            </tbody>
                        </table>
                    </div>
                ) : filteredAndSorted.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border py-16 text-center">
                        <ShieldCheck className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            No contests found matching the criteria.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-border overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/40">
                                <tr>
                                    <SortHeader field="title" className="text-left">Contest</SortHeader>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Division</th>
                                    <SortHeader field="start" className="text-center">Start Time</SortHeader>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSorted.map((c) => (
                                    <ContestRow key={c.id} contest={c} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
