import {useState, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {toast} from 'sonner';
import {
    User as UserIcon,
    Mail,
    Building2,
    TrendingUp,
    Trophy,
    Shield,
    Loader2,
    Edit3,
    AtSign,
    CheckCircle2,
    Code2,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardFooter} from '@/components/ui/card';
import api from '@/lib/axios';
import {useAuth} from '@/context/AuthContext';
import {getRankDetails} from '@/constants/ratings';
import RatingGraph from '@/components/RatingGraph';
import ActivityHeatmap from '@/components/ActivityHeatmap';

export default function UserProfile() {
    const {user} = useAuth();
    const navigate = useNavigate();
    const {username} = useParams();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    const [activityStats, setActivityStats] = useState(null);
    const [activityLoading, setActivityLoading] = useState(true);
    const [activityYear, setActivityYear] = useState(new Date().getFullYear());

    // ── fetch profile ──────────────────────────────────────────────────────
    useEffect(() => {
        const fetch = async () => {
            if (!username) return;
            setLoading(true);
            try {
                const res = await api.get(`/users/username/${username}`);
                setProfile(res.data.data);
            } catch (err) {
                toast.error(
                    err?.response?.data?.message || 'Failed to load profile.'
                );
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [username]);

    // ── fetch contest history ──────────────────────────────────────────────
    useEffect(() => {
        const fetch = async () => {
            if (!username) return;
            setHistoryLoading(true);
            try {
                const res = await api.get(`/users/username/${username}/contest-history`);
                setHistory(res.data.data || []);
            } catch {
                // silent — graph shows empty state
            } finally {
                setHistoryLoading(false);
            }
        };
        fetch();
    }, [username]);

    // ── fetch activity stats (year-aware) ──────────────────────────────────
    useEffect(() => {
        const fetch = async () => {
            if (!username) return;
            setActivityLoading(true);
            try {
                const res = await api.get(
                    `/users/username/${username}/activity-stats?year=${activityYear}`
                );
                setActivityStats(res.data.data);
            } catch {
                // silent
            } finally {
                setActivityLoading(false);
            }
        };
        fetch();
    }, [username, activityYear]);

    // ── loading / not-found states ─────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading profile…</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-muted-foreground">User profile could not be found.</p>
            </div>
        );
    }

    const rank = getRankDetails(profile.rating);

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">

                {/* ── page header ── */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            User Profile
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            View account details and contest history
                        </p>
                    </div>
                </div>

                {/* ── profile card ── */}
                <Card className="border-border overflow-hidden">
                    {/* banner */}
                    <div className="bg-muted/30 p-6 border-b border-border flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <UserIcon className="w-10 h-10 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                                <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
                                <span className={`inline-flex items-center self-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-background border border-border ${rank.colorClass}`}>
                                    {rank.title}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                                <p className="text-sm text-muted-foreground flex items-center gap-1 font-medium">
                                    <AtSign className="w-4 h-4 text-muted-foreground/60" />
                                    {profile.username}
                                </p>
                                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                                    profile.isOnline
                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                        : 'bg-muted text-muted-foreground border-border'
                                }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                        profile.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/50'
                                    }`} />
                                    {profile.isOnline ? 'online' : 'offline'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* body: 2-column grid on md+ */}
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* col 1 — account info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80 border-b border-border/40 pb-1">
                                Account Information
                            </h3>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground font-semibold">Email Address</span>
                                <span className="text-sm text-foreground flex items-center gap-2 font-medium">
                                    <Mail className="w-4 h-4 text-muted-foreground/50" />
                                    {profile.email}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground font-semibold">Academic Institute</span>
                                <span className="text-sm text-foreground flex items-center gap-2 font-medium">
                                    <Building2 className="w-4 h-4 text-muted-foreground/50" />
                                    {profile.institute || (
                                        <span className="text-muted-foreground italic font-normal">Not specified</span>
                                    )}
                                </span>
                            </div>
                            {profile.role === 'admin' && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground font-semibold">Role</span>
                                    <span className="text-sm text-foreground flex items-center gap-2 font-medium">
                                        <Shield className="w-4 h-4 text-muted-foreground/50" />
                                        <span className="capitalize">{profile.role}</span>
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* col 2 — rating */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80 border-b border-border/40 pb-1">
                                Rating &amp; Stats
                            </h3>
                            <div className="flex items-center justify-between border border-border/40 p-3.5 rounded-lg bg-muted/10">
                                <span className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    Current Rating
                                </span>
                                <span className={`font-extrabold text-2xl ${rank.colorClass}`}>
                                    {profile.rating || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border border-border/40 p-3.5 rounded-lg bg-muted/10">
                                <span className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
                                    <Trophy className="w-4 h-4 text-amber-500" />
                                    Max Rating
                                </span>
                                <span className="font-extrabold text-2xl text-foreground">
                                    {profile.max_rating || 0}
                                </span>
                            </div>
                        </div>
                    </CardContent>

                    {user?.username === profile.username && (
                        <CardFooter className="flex justify-end border-t border-border p-4 bg-muted/5">
                            <Button onClick={() => navigate('/user-profile/edit')} className="gap-2">
                                <Edit3 className="w-4 h-4" />
                                Update Profile
                            </Button>
                        </CardFooter>
                    )}
                </Card>

                {/* ── rating history graph ── */}
                <RatingGraph history={history} loading={historyLoading} />

                {/* ── activity heatmap ── */}
                <ActivityHeatmap
                    stats={activityStats}
                    loading={activityLoading}
                    onYearChange={(y) => setActivityYear(y)}
                />

            </div>
        </div>
    );
}
