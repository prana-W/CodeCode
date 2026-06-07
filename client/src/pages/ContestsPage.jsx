import {useState, useEffect, useMemo} from 'react';
import {useNavigate} from 'react-router-dom';
import {toast} from 'sonner';
import {
    Trophy,
    LogIn,
    LogOut as LogOutIcon,
    ChevronRight,
    Timer,
    ArrowUpDown,
    Users,
    Shield,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import api from '@/lib/axios';
import {useAuth} from '@/context/AuthContext';
import {DIV_LABELS} from '@/constants/ratings';

const REGISTRATION_WINDOW_MINUTES = 30;

function getContestStatus(contest) {
    const now = new Date();
    const start = new Date(contest.contest_start_time);
    const end = new Date(contest.contest_end_time);
    if (now < start) return 'upcoming';
    if (now >= start && now < end) return 'running';
    return 'past';
}

function canRegister(contest) {
    const now = new Date();
    const start = new Date(contest.contest_start_time);
    const deadline = new Date(
        start.getTime() + REGISTRATION_WINDOW_MINUTES * 60 * 1000
    );
    const end = new Date(contest.contest_end_time);
    return now < deadline && now < end;
}

function canUnregister(contest) {
    const now = new Date();
    const start = new Date(contest.contest_start_time);
    return now < start;
}

function isContestStarted(contest) {
    return new Date() >= new Date(contest.contest_start_time);
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

function formatDuration(startIso, endIso) {
    const dur = (new Date(endIso) - new Date(startIso)) / 60000;
    if (dur >= 60) {
        const h = Math.floor(dur / 60);
        const m = dur % 60;
        return `${h}h${m ? ` ${m}m` : ''}`;
    }
    return `${dur}m`;
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

function getTimeRemaining(iso) {
    const diff = new Date(iso) - new Date();
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (hours > 0)
        return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function SkeletonRow() {
    return (
        <tr>
            <td className="px-4 py-4">
                <div className="skeleton h-5 w-48 rounded" />
            </td>
            <td className="px-4 py-4">
                <div className="skeleton h-5 w-12 rounded-full mx-auto" />
            </td>
            <td className="px-4 py-4">
                <div className="skeleton h-5 w-24 rounded mx-auto" />
            </td>
            <td className="px-4 py-4">
                <div className="skeleton h-5 w-16 rounded mx-auto" />
            </td>
            <td className="px-4 py-4">
                <div className="skeleton h-8 w-24 rounded mx-auto" />
            </td>
        </tr>
    );
}

function ContestRow({contest, regStatus, onRegister, onUnregister}) {
    const navigate = useNavigate();
    const {user} = useAuth();
    const status = getContestStatus(contest);
    const [acting, setActing] = useState(false);
    const [, setTick] = useState(0);

    useEffect(() => {
        if (status !== 'upcoming' && status !== 'running') return;
        const interval = setInterval(() => setTick((t) => t + 1), 1000);
        return () => clearInterval(interval);
    }, [status]);

    const isRegistered = regStatus?.is_registered === true;
    const started = isContestStarted(contest);
    const showRegister = !isRegistered && canRegister(contest);
    const showUnregister = isRegistered && canUnregister(contest);
    const showEnter = isRegistered && started && status === 'running';

    const handleRegister = async () => {
        setActing(true);
        try {
            const res = await api.post('/contests/register', {
                contest_id: contest.id,
            });
            toast.success(`Registered for "${contest.title}"!`);
            onRegister(contest.id, res.data.data);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Registration failed.');
        } finally {
            setActing(false);
        }
    };

    const handleUnregister = async () => {
        setActing(true);
        try {
            await api.delete('/contests/register', {
                data: {contest_id: contest.id},
            });
            toast.success(`Unregistered from "${contest.title}".`);
            onUnregister(contest.id);
        } catch (err) {
            toast.error(
                err?.response?.data?.message || 'Failed to unregister.'
            );
        } finally {
            setActing(false);
        }
    };

    const handleEnter = () => {
        navigate(`/contest/${contest.id}`);
    };

    const div = DIV_LABELS[contest.division] || {
        label: `Div. ${contest.division}`,
    };
    const timeUntilStart =
        status === 'upcoming' ? getTimeUntil(contest.contest_start_time) : null;
    const remaining =
        status === 'running'
            ? getTimeRemaining(contest.contest_end_time)
            : null;

    return (
        <tr
            className={`group border-b border-border transition-colors hover:bg-muted/30 ${
                status === 'running' ? 'bg-green-500/5' : ''
            }`}
        >
            <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                    <div
                        className={`div-badge-${contest.division} flex items-center justify-center w-9 h-9 rounded-lg text-[11px] font-bold shrink-0`}
                    >
                        D{contest.division}
                    </div>
                    <div className="min-w-0">
                        <div className="font-semibold text-foreground text-sm leading-tight truncate max-w-[300px]">
                            {contest.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                                By {contest.authored_by_name}
                            </span>
                            <span className={`status-dot status-${status}`} />
                            {status === 'upcoming' && timeUntilStart && (
                                <span className="text-xs text-amber-500 font-semibold font-mono">
                                    in {timeUntilStart}
                                </span>
                            )}
                            {status === 'running' && remaining && (
                                <span className="text-xs text-emerald-500 font-semibold font-mono">
                                    {remaining} left
                                </span>
                            )}
                            {regStatus?.total_registered !== undefined && (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                                    <span className="text-muted-foreground/30">
                                        •
                                    </span>
                                    <Users className="w-3.5 h-3.5 text-muted-foreground/60" />
                                    <span className="font-mono">
                                        {regStatus.total_registered}
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </td>

            <td className="px-4 py-3.5 text-center">
                <span
                    className={`div-badge-${contest.division} text-[10px] font-bold px-2 py-0.5 rounded-md`}
                >
                    {div.label}
                </span>
            </td>

            <td className="px-4 py-3.5 text-center">
                <div className="text-sm text-foreground font-mono">
                    {formatDate(contest.contest_start_time)}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                    {formatTime(contest.contest_start_time)}
                </div>
            </td>

            <td className="px-4 py-3.5 text-center">
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground font-mono">
                    <Timer className="w-3.5 h-3.5" />
                    {formatDuration(
                        contest.contest_start_time,
                        contest.contest_end_time
                    )}
                </span>
            </td>

            <td className="px-4 py-3.5 text-center">
                {!user ? (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/login')}
                        className="gap-1.5 text-xs"
                    >
                        <LogIn className="w-3 h-3" />
                        Login
                    </Button>
                ) : showEnter ? (
                    <Button
                        size="sm"
                        onClick={handleEnter}
                        className="gap-1.5 text-xs"
                    >
                        Enter
                        <ChevronRight className="w-3 h-3" />
                    </Button>
                ) : showRegister ? (
                    <Button
                        id={`register-${contest.id}`}
                        size="sm"
                        onClick={handleRegister}
                        disabled={acting}
                        className="gap-1.5 text-xs"
                    >
                        <Users className="w-3 h-3" />
                        {acting ? 'Registering…' : 'Register'}
                    </Button>
                ) : showUnregister ? (
                    <Button
                        id={`unregister-${contest.id}`}
                        size="sm"
                        variant="outline"
                        onClick={handleUnregister}
                        disabled={acting}
                        className="gap-1.5 text-xs hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
                    >
                        <LogOutIcon className="w-3 h-3" />
                        {acting ? 'Cancelling…' : 'Unregister'}
                    </Button>
                ) : isRegistered && status === 'upcoming' ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-semibold px-2 py-1 bg-emerald-500/10 rounded-md">
                        <Shield className="w-3 h-3" />
                        Registered
                    </span>
                ) : isRegistered && status === 'past' ? (
                    <span className="text-xs text-muted-foreground">
                        Participated
                    </span>
                ) : status === 'past' ? (
                    <span className="text-xs text-muted-foreground">Ended</span>
                ) : (
                    <span className="text-xs text-muted-foreground">
                        Closed
                    </span>
                )}
            </td>
        </tr>
    );
}

export default function ContestsPage() {
    const {user} = useAuth();
    const [contests, setContests] = useState([]);
    const [regMap, setRegMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState('start');
    const [sortDir, setSortDir] = useState('asc');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get('/contests');
                const all = res.data.data || [];
                const now = new Date();
                const cutoff = new Date(now.getTime() - 7 * 86400000);
                const visible = all.filter(
                    (c) => new Date(c.contest_end_time) > cutoff
                );
                setContests(visible);

                if (user) {
                    const statuses = {};
                    await Promise.all(
                        visible.map(async (c) => {
                            try {
                                const regRes = await api.get(
                                    `/contests/register/status?contest_id=${c.id}`
                                );
                                statuses[c.id] = regRes.data.data;
                            } catch {
                                statuses[c.id] = {is_registered: false};
                            }
                        })
                    );
                    setRegMap(statuses);
                }
            } catch (err) {
                toast.error(
                    err?.response?.data?.message || 'Failed to load contests.'
                );
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const handleRegister = (contestId, regData) => {
        setRegMap((prev) => ({
            ...prev,
            [contestId]: {
                is_registered: true,
                registered_at:
                    regData?.registered_at || new Date().toISOString(),
                total_registered:
                    regData?.total_registered !== undefined
                        ? regData.total_registered
                        : prev[contestId]?.total_registered !== undefined
                          ? prev[contestId].total_registered + 1
                          : 1,
            },
        }));
    };

    const handleUnregister = (contestId) => {
        setRegMap((prev) => ({
            ...prev,
            [contestId]: {
                is_registered: false,
                total_registered:
                    prev[contestId]?.total_registered !== undefined
                        ? Math.max(0, prev[contestId].total_registered - 1)
                        : 0,
            },
        }));
    };

    const toggleSort = (field) => {
        if (sortField === field) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const {upcoming, running, past} = useMemo(() => {
        const groups = {upcoming: [], running: [], past: []};
        contests.forEach((c) => {
            const s = getContestStatus(c);
            groups[s].push(c);
        });

        const comparator = (a, b) => {
            let cmp = 0;
            if (sortField === 'start') {
                cmp =
                    new Date(a.contest_start_time) -
                    new Date(b.contest_start_time);
            } else if (sortField === 'title') {
                cmp = a.title.localeCompare(b.title);
            } else if (sortField === 'div') {
                cmp = a.division - b.division;
            } else if (sortField === 'duration') {
                const dA =
                    new Date(a.contest_end_time) -
                    new Date(a.contest_start_time);
                const dB =
                    new Date(b.contest_end_time) -
                    new Date(b.contest_start_time);
                cmp = dA - dB;
            }
            return sortDir === 'desc' ? -cmp : cmp;
        };

        groups.upcoming.sort(comparator);
        groups.running.sort(comparator);
        groups.past.sort(
            (a, b) =>
                new Date(b.contest_start_time) - new Date(a.contest_start_time)
        );

        return groups;
    }, [contests, sortField, sortDir]);

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
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
                            <Trophy className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                                Contests
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Competitive programming contests on CodeCode
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
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
                                        Start
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                                        Duration
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <SkeletonRow key={i} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : contests.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border py-16 text-center">
                        <Trophy className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            No contests available at the moment.
                        </p>
                    </div>
                ) : (
                    <>
                        {running.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="status-dot status-running" />
                                    <h2 className="text-xs font-bold text-emerald-500 uppercase tracking-wider font-mono">
                                        Running Now ({running.length})
                                    </h2>
                                </div>
                                <div className="rounded-xl border border-emerald-500/20 overflow-hidden bg-emerald-500/5">
                                    <table className="w-full">
                                        <thead className="bg-emerald-500/10">
                                            <tr>
                                                <SortHeader
                                                    field="title"
                                                    className="text-left"
                                                >
                                                    Contest
                                                </SortHeader>
                                                <SortHeader
                                                    field="div"
                                                    className="text-center"
                                                >
                                                    Division
                                                </SortHeader>
                                                <SortHeader
                                                    field="start"
                                                    className="text-center"
                                                >
                                                    Start
                                                </SortHeader>
                                                <SortHeader
                                                    field="duration"
                                                    className="text-center"
                                                >
                                                    Duration
                                                </SortHeader>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {running.map((c) => (
                                                <ContestRow
                                                    key={c.id}
                                                    contest={c}
                                                    regStatus={regMap[c.id]}
                                                    onRegister={handleRegister}
                                                    onUnregister={
                                                        handleUnregister
                                                    }
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}

                        {upcoming.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="status-dot status-upcoming" />
                                    <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider font-mono">
                                        Upcoming ({upcoming.length})
                                    </h2>
                                </div>
                                <div className="rounded-xl border border-border overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-muted/40">
                                            <tr>
                                                <SortHeader
                                                    field="title"
                                                    className="text-left"
                                                >
                                                    Contest
                                                </SortHeader>
                                                <SortHeader
                                                    field="div"
                                                    className="text-center"
                                                >
                                                    Division
                                                </SortHeader>
                                                <SortHeader
                                                    field="start"
                                                    className="text-center"
                                                >
                                                    Start
                                                </SortHeader>
                                                <SortHeader
                                                    field="duration"
                                                    className="text-center"
                                                >
                                                    Duration
                                                </SortHeader>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {upcoming.map((c) => (
                                                <ContestRow
                                                    key={c.id}
                                                    contest={c}
                                                    regStatus={regMap[c.id]}
                                                    onRegister={handleRegister}
                                                    onUnregister={
                                                        handleUnregister
                                                    }
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}

                        {past.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="status-dot status-past" />
                                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">
                                        Recent ({past.length})
                                    </h2>
                                </div>
                                <div className="rounded-xl border border-border overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-muted/40">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Contest
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Division
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Start
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Duration
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="opacity-60">
                                            {past.map((c) => (
                                                <ContestRow
                                                    key={c.id}
                                                    contest={c}
                                                    regStatus={regMap[c.id]}
                                                    onRegister={handleRegister}
                                                    onUnregister={
                                                        handleUnregister
                                                    }
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
