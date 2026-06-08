import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {toast} from 'sonner';
import {
    Plus,
    Trophy,
    Calendar,
    Clock,
    Shield,
    ShieldOff,
    ChevronRight,
    Trash2,
    Search,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import api from '@/lib/axios';

const FILTERS = [
    {key: 'all', label: 'All'},
    {key: 'upcoming', label: 'Upcoming'},
    {key: 'running', label: 'Running'},
    {key: 'past', label: 'Past'},
    {key: 'verified', label: 'Verified'},
    {key: 'unverified', label: 'Unverified'},
];

function getContestStatus(contest) {
    const now = new Date();
    const start = new Date(contest.contest_start_time);
    const end = new Date(contest.contest_end_time);
    if (now < start) return 'upcoming';
    if (now >= start && now < end) return 'running';
    return 'past';
}

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

function formatDateTime(iso) {
    return `${formatDate(iso)}, ${formatTime(iso)}`;
}

function getTimeUntil(iso) {
    const diff = new Date(iso) - new Date();
    if (diff <= 0) return null;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

function SkeletonCard() {
    return (
        <div className="rounded-xl border border-border p-5 space-y-3">
            <div className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-2/3 rounded" />
                    <div className="skeleton h-3 w-1/3 rounded" />
                </div>
            </div>
            <div className="flex gap-2">
                <div className="skeleton h-6 w-16 rounded-full" />
                <div className="skeleton h-6 w-20 rounded-full" />
            </div>
            <div className="skeleton h-3 w-full rounded" />
        </div>
    );
}

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

function ContestCard({contest, onDelete}) {
    const navigate = useNavigate();
    const status = getContestStatus(contest);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            await api.delete(`/contests/${contest.id}`);
            toast.success(`"${contest.title}" deleted.`);
            onDelete(contest.id);
        } catch (err) {
            toast.error(
                err?.response?.data?.message || 'Failed to delete contest.'
            );
        } finally {
            setDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    const timeUntil =
        status === 'upcoming' ? getTimeUntil(contest.contest_start_time) : null;

    return (
        <div
            id={`contest-card-${contest.id}`}
            className="contest-card rounded-xl border border-border bg-card cursor-pointer group"
            onClick={() => navigate(`/design-contest/contest/${contest.id}`)}
        >
            <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                            className={`div-badge-${contest.division} flex items-center justify-center w-10 h-10 rounded-lg text-xs font-bold shrink-0`}
                        >
                            D{contest.division}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-foreground truncate text-[15px] leading-tight">
                                {contest.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span
                                    className={`status-dot status-${status}`}
                                />
                                <span className="text-xs text-muted-foreground capitalize">
                                    {status}
                                </span>
                                {timeUntil && (
                                    <span className="text-xs text-muted-foreground font-mono">
                                        · starts in {timeUntil}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                            id={`delete-contest-${contest.id}`}
                            size="sm"
                            variant="ghost"
                            onClick={handleDeleteClick}
                            disabled={deleting}
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                            title="Delete contest"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-mono">
                    <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground/60" />
                        {formatDateTime(contest.contest_start_time)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground/60" />
                        {(() => {
                            const dur =
                                (new Date(contest.contest_end_time) -
                                    new Date(contest.contest_start_time)) /
                                60000;
                            return dur >= 60
                                ? `${Math.floor(dur / 60)}h ${dur % 60 ? `${dur % 60}m` : ''}`
                                : `${dur}m`;
                        })()}
                    </span>
                    {contest.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold font-sans">
                            <Shield className="w-3 h-3" />
                            Verified
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-amber-500 font-semibold font-sans">
                            <ShieldOff className="w-3 h-3" />
                            Pending Review
                        </span>
                    )}
                </div>

                {contest.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                        {contest.description}
                    </p>
                )}
            </div>

            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            >
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Contest</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{contest.title}"?
                            This action cannot be undone and will delete all
                            associated problems and data.
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

export default function ContestListPage() {
    const navigate = useNavigate();
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchMyContests = async () => {
            setLoading(true);
            try {
                const res = await api.get('/contests/my');
                setContests(res.data.data || []);
            } catch (err) {
                toast.error(
                    err?.response?.data?.message ||
                        'Failed to load your contests.'
                );
            } finally {
                setLoading(false);
            }
        };
        fetchMyContests();
    }, []);

    const handleDelete = (id) => {
        setContests((prev) => prev.filter((c) => c.id !== id));
    };

    const filtered = contests.filter((c) => {
        if (search && !c.title.toLowerCase().includes(search.toLowerCase()))
            return false;

        const status = getContestStatus(c);
        switch (filter) {
            case 'upcoming':
                return status === 'upcoming';
            case 'running':
                return status === 'running';
            case 'past':
                return status === 'past';
            case 'verified':
                return c.isVerified;
            case 'unverified':
                return !c.isVerified;
            default:
                return true;
        }
    });

    const counts = {};
    FILTERS.forEach(({key}) => {
        counts[key] = contests.filter((c) => {
            const status = getContestStatus(c);
            switch (key) {
                case 'upcoming':
                    return status === 'upcoming';
                case 'running':
                    return status === 'running';
                case 'past':
                    return status === 'past';
                case 'verified':
                    return c.isVerified;
                case 'unverified':
                    return !c.isVerified;
                default:
                    return true;
            }
        }).length;
    });

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b border-border bg-card/50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight text-foreground">
                                My Contests
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Manage your designed contests, problems, and
                                test cases.
                            </p>
                        </div>
                        <Button
                            id="create-new-contest"
                            onClick={() =>
                                navigate('/design-contest/contest/new')
                            }
                            className="gap-2 shrink-0 text-xs font-semibold uppercase tracking-wider"
                        >
                            <Plus className="w-4 h-4" />
                            New Contest
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                <div className="space-y-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                            id="contest-search"
                            placeholder="Search contests…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="flex items-center gap-1 border-b border-border overflow-x-auto pb-0">
                        {FILTERS.map(({key, label}) => (
                            <button
                                key={key}
                                id={`filter-${key}`}
                                onClick={() => setFilter(key)}
                                className={`filter-tab text-sm font-medium px-3 py-2 whitespace-nowrap ${
                                    filter === key
                                        ? 'active text-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {label}
                                {counts[key] > 0 && (
                                    <span
                                        className={`ml-1.5 text-xs font-mono px-1.5 py-0.5 rounded-full ${
                                            filter === key
                                                ? 'bg-primary/10 text-primary'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {counts[key]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {[1, 2, 3, 4].map((i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border py-16 text-center">
                        <Trophy className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            {contests.length === 0
                                ? "You haven't designed any contests yet."
                                : 'No contests match the current filter.'}
                        </p>
                        {contests.length === 0 && (
                            <Button
                                className="mt-4 gap-2 text-xs font-semibold uppercase tracking-wider"
                                onClick={() =>
                                    navigate('/design-contest/contest/new')
                                }
                            >
                                <Plus className="w-4 h-4" />
                                Create Your First Contest
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {filtered.map((contest) => (
                            <ContestCard
                                key={contest.id}
                                contest={contest}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
