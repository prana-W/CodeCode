import {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    Trophy,
    Users,
    Code2,
    BarChart2,
    ArrowRight,
    Clock,
    Calendar,
    Flame,
    TrendingUp,
    Activity,
    Zap,
    Target,
    ChevronRight,
    Star,
    GitCommitHorizontal,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import api from '@/lib/axios';
import {useAuth} from '@/context/AuthContext';

function useCountUp(target, duration = 1800, start = false) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!start || target === 0) return;
        let startTime = null;
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target, duration, start]);
    return value;
}

function StatCard({icon: Icon, label, value, color, delay = 0, animate}) {
    const count = useCountUp(value, 1600, animate);
    const bgColor =
        color.split(' ').find((c) => c.startsWith('bg-')) || 'bg-primary';

    return (
        <div
            className="relative group overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            style={{animationDelay: `${delay}ms`}}
        >
            <div
                className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center mb-4 relative z-10 text-white`}
            >
                <Icon className="w-6 h-6" />
            </div>
            <p className="text-3xl font-black text-foreground tabular-nums relative z-10 font-mono">
                {count.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground font-medium mt-1 relative z-10">
                {label}
            </p>
        </div>
    );
}

function MiniHeatmap() {
    const cells = Array.from({length: 7 * 20}, () => {
        const rand = Math.random();
        if (rand < 0.45) return 0;
        if (rand < 0.65) return 1;
        if (rand < 0.8) return 2;
        if (rand < 0.92) return 3;
        return 4;
    });
    const colors = [
        'bg-muted/50',
        'bg-emerald-500/20',
        'bg-emerald-500/40',
        'bg-emerald-500/65',
        'bg-emerald-500',
    ];
    return (
        <div className="flex gap-[3px]">
            {Array.from({length: 20}, (_, col) => (
                <div key={col} className="flex flex-col gap-[3px]">
                    {Array.from({length: 7}, (_, row) => (
                        <div
                            key={row}
                            className={`w-3 h-3 rounded-[2px] ${colors[cells[col * 7 + row]]}`}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

function MiniRatingChart() {
    const points = [800, 950, 900, 1100, 1050, 1250, 1200, 1400, 1380, 1550];
    const min = Math.min(...points);
    const max = Math.max(...points);
    const h = 60;
    const w = 160;
    const pad = 4;
    const xs = points.map(
        (_, i) => pad + (i / (points.length - 1)) * (w - pad * 2)
    );
    const ys = points.map(
        (p) => h - pad - ((p - min) / (max - min)) * (h - pad * 2)
    );
    const pathD = xs
        .map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`)
        .join(' ');
    const areaD = `${pathD} L${xs[xs.length - 1]},${h} L${xs[0]},${h} Z`;
    return (
        <svg width={w} height={h} className="overflow-visible">
            <defs>
                <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaD} fill="url(#rg)" />
            <path
                d={pathD}
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {xs.map((x, i) => (
                <circle key={i} cx={x} cy={ys[i]} r="3" fill="#f97316" />
            ))}
        </svg>
    );
}

function UpcomingContestCard({contest}) {
    const navigate = useNavigate();
    const start = new Date(contest.contest_start_time);
    const end = new Date(contest.contest_end_time);
    const now = new Date();
    const diffMs = start - now;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHrs / 24);
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const durationMs = end - start;
    const durationHrs = Math.round(durationMs / (1000 * 60 * 60));

    let timeLabel;
    if (diffDays > 0) timeLabel = `${diffDays}d ${diffHrs % 24}h`;
    else if (diffHrs > 0) timeLabel = `${diffHrs}h ${diffMins}m`;
    else timeLabel = `${diffMins}m`;

    const divColors = {
        'Div. 1': 'bg-red-500/10 text-red-500 border-red-500/20',
        'Div. 2': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        'Div. 3': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        'Div. 4': 'bg-green-500/10 text-green-500 border-green-500/20',
    };

    return (
        <div
            onClick={() => navigate('/contests')}
            className="group flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Trophy className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">
                    {contest.title}
                </p>
                <div className="flex items-center gap-3 mt-1 flex-wrap font-mono text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        In {timeLabel}
                    </span>
                    <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 shrink-0" />
                        {Number(contest.registered_count)} registered
                    </span>
                    {durationHrs > 0 && (
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 shrink-0" />
                            {durationHrs}h
                        </span>
                    )}
                </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
                <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${divColors[contest.division] || 'bg-muted text-muted-foreground border-border'}`}
                >
                    {contest.division || 'Open'}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
        </div>
    );
}

function FeatureCard({icon: Icon, title, description, accent, visual}) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div
                className={`absolute top-0 left-0 right-0 h-1 ${accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            />
            <div
                className={`w-10 h-10 rounded-xl ${accent} bg-opacity-10 flex items-center justify-center mb-4`}
            >
                <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {description}
            </p>
            {visual && (
                <div className="mt-2 opacity-70 group-hover:opacity-100 transition-opacity">
                    {visual}
                </div>
            )}
        </div>
    );
}

function HeroSection({stats, loading}) {
    const navigate = useNavigate();
    const {user} = useAuth();

    return (
        <section className="relative overflow-hidden min-h-[85vh] flex items-center">
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
            <div className="absolute top-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-20 left-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 w-full">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                            <Flame className="w-3.5 h-3.5" />
                            Competitive Programming Platform
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-foreground leading-[1.05]">
                                Code.
                                <br />
                                <span className="text-primary">Compete.</span>
                                <br />
                                Conquer.
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                                Join a platform built for competitive
                                programmers — with real-time contests, Elo-based
                                ratings, detailed analytics, and a community
                                that pushes you to be better.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {user ? (
                                <Button
                                    size="lg"
                                    className="gap-2 rounded-xl font-bold px-6 text-xs uppercase tracking-wider"
                                    onClick={() => navigate('/contests')}
                                >
                                    View Contests{' '}
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        size="lg"
                                        className="gap-2 rounded-xl font-bold px-6 text-xs uppercase tracking-wider"
                                        onClick={() => navigate('/register')}
                                    >
                                        Get Started{' '}
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="gap-2 rounded-xl font-bold px-6 text-xs uppercase tracking-wider"
                                        onClick={() => navigate('/login')}
                                    >
                                        Sign In
                                    </Button>
                                </>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-6 pt-2 font-mono">
                            {[
                                {
                                    label: 'Active Users',
                                    value: loading
                                        ? '...'
                                        : stats.totalUsers.toLocaleString(),
                                },
                                {
                                    label: 'Contests Held',
                                    value: loading
                                        ? '...'
                                        : stats.totalContests.toLocaleString(),
                                },
                                {
                                    label: 'Submissions',
                                    value: loading
                                        ? '...'
                                        : stats.totalSubmissions.toLocaleString(),
                                },
                            ].map((s) => (
                                <div key={s.label}>
                                    <p className="text-2xl font-black text-foreground">
                                        {s.value}
                                    </p>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">
                                        {s.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative hidden lg:block">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-emerald-500/20 blur-3xl rounded-full opacity-50" />

                        <div className="relative rounded-2xl border border-border/50 bg-[#0d1117] shadow-2xl overflow-hidden transform transition-transform hover:scale-[1.02] duration-500">
                            <div className="flex items-center px-4 py-3 border-b border-white/10 bg-[#161b22]">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                </div>
                                <div className="mx-auto text-xs text-muted-foreground font-medium flex items-center gap-2">
                                    <Code2 className="w-3.5 h-3.5" /> main.cpp
                                </div>
                            </div>
                            <div className="p-6 font-mono text-sm overflow-hidden leading-relaxed select-none">
                                <div className="text-gray-400">
                                    #include &lt;iostream&gt;
                                </div>
                                <div className="text-gray-400">
                                    #include &lt;life.h&gt;
                                </div>
                                <div className="mt-1 text-purple-400">
                                    using namespace{' '}
                                    <span className="text-gray-200">std;</span>
                                </div>
                                <div className="mt-4 text-blue-400">
                                    int{' '}
                                    <span className="text-yellow-200">
                                        main
                                    </span>
                                    <span className="text-gray-200">
                                        () {'{'}
                                    </span>
                                </div>
                                <div className="pl-4 text-purple-400">
                                    bool{' '}
                                    <span className="text-gray-200">
                                        alive ={' '}
                                    </span>
                                    <span className="text-orange-400">
                                        true
                                    </span>
                                    <span className="text-gray-200">;</span>
                                </div>
                                <div className="mt-4 pl-4 text-purple-400">
                                    while{' '}
                                    <span className="text-gray-200">
                                        (alive) {'{'}
                                    </span>
                                </div>
                                <div className="pl-8 text-blue-400">
                                    eat
                                    <span className="text-gray-200">();</span>
                                </div>
                                <div className="pl-8 text-blue-400">
                                    sleep
                                    <span className="text-gray-200">();</span>
                                </div>
                                <div className="pl-8 text-blue-400">
                                    code
                                    <span className="text-gray-200">();</span>
                                </div>
                                <div className="pl-8 text-blue-400">
                                    repeat
                                    <span className="text-gray-200">();</span>
                                </div>
                                <div className="pl-4 text-gray-200">{'}'}</div>
                                <div className="mt-4 pl-4 text-purple-400">
                                    return{' '}
                                    <span className="text-orange-400">0</span>
                                    <span className="text-gray-200">;</span>
                                </div>
                                <div className="text-gray-200">{'}'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function StatsSection({stats, loading}) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setVisible(true);
            },
            {threshold: 0.3}
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const items = [
        {
            icon: Users,
            label: 'Total Users',
            value: stats.totalUsers,
            color: 'bg-blue-500 text-blue-500',
        },
        {
            icon: Trophy,
            label: 'Contests Held',
            value: stats.totalContests,
            color: 'bg-amber-500 text-amber-500',
        },
        {
            icon: Code2,
            label: 'Problems',
            value: stats.totalProblems,
            color: 'bg-purple-500 text-purple-500',
        },
        {
            icon: BarChart2,
            label: 'Submissions',
            value: stats.totalSubmissions,
            color: 'bg-emerald-500 text-emerald-500',
        },
    ];

    return (
        <section
            className="py-20 px-4 bg-muted/30 border-y border-border"
            ref={ref}
        >
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                        Platform Stats
                    </p>
                    <h2 className="text-3xl font-bold font-serif text-foreground">
                        Growing Every Day
                    </h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {items.map((item, i) => (
                        <StatCard
                            key={item.label}
                            {...item}
                            delay={i * 100}
                            animate={visible && !loading}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

function UpcomingContestsSection({contests}) {
    const navigate = useNavigate();
    return (
        <section className="py-20 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                            Upcoming
                        </p>
                        <h2 className="text-3xl font-serif font-bold text-foreground">
                            Contests This Week
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Verified contests starting within the next 7 days.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="gap-2 rounded-xl text-xs font-semibold uppercase tracking-wider"
                        onClick={() => navigate('/contests')}
                    >
                        View All <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>

                {contests.length === 0 ? (
                    <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-muted/20">
                        <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">
                            No upcoming contests this week.
                        </p>
                        <p className="text-sm text-muted-foreground/60 mt-1">
                            Check back soon or design your own!
                        </p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {contests.map((c) => (
                            <UpcomingContestCard key={c.id} contest={c} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function FeaturesSection() {
    const features = [
        {
            icon: Activity,
            title: 'Submission Heatmap',
            description:
                'Visualize your coding consistency with a GitHub-style activity heatmap. Track daily submissions, build streaks, and see your progress across the entire year.',
            accent: 'bg-emerald-500',
            visual: <MiniHeatmap />,
        },
        {
            icon: TrendingUp,
            title: 'Contest Rating Graph',
            description:
                'See your competitive journey at a glance. Every contest you participate in is plotted with your final rating, delta, and rank — just like Codeforces.',
            accent: 'bg-orange-500',
            visual: <MiniRatingChart />,
        },
        {
            icon: Target,
            title: 'Elo-Based Rating System',
            description:
                'A fair, zero-sum Elo rating system that calculates your performance relative to other participants in every contest. Climb the divisions — Div. 1 through Div. 4.',
            accent: 'bg-amber-500',
        },
        {
            icon: Zap,
            title: 'Live Online Indicator',
            description:
                'Real-time presence tracking powered by Redis heartbeats. See how many users are active on the platform right now, and whether a user is currently online.',
            accent: 'bg-blue-500',
        },
        {
            icon: GitCommitHorizontal,
            title: 'Streak Tracking',
            description:
                'Stay consistent with current and longest streak tracking. The platform rewards discipline — every day you submit at least one accepted solution counts.',
            accent: 'bg-emerald-500',
        },
        {
            icon: Star,
            title: 'AI Assistant',
            description:
                'Get conceptual hints from an in-built AI assistant during contests where AI assistance is enabled by the contest author — never the solution, just the right nudge.',
            accent: 'bg-purple-500',
        },
    ];

    return (
        <section className="py-20 px-4 bg-muted/20 border-y border-border">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-14">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                        Features
                    </p>
                    <h2 className="text-3xl font-serif font-bold text-foreground mb-3">
                        Everything You Need to Compete
                    </h2>
                    <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
                        Built with competitive programmers in mind. Rich
                        analytics, real-time features, and a rating system that
                        fairly measures your growth.
                    </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f) => (
                        <FeatureCard key={f.title} {...f} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function CTASection() {
    const navigate = useNavigate();
    const {user} = useAuth();
    if (user) return null;
    return (
        <section className="py-20 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 text-center shadow-2xl shadow-primary/20">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1),_transparent)]" />
                    <div className="relative">
                        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-primary-foreground mb-4">
                            Ready to Start Competing?
                        </h2>
                        <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto text-sm">
                            Create a free account and join thousands of
                            programmers improving their skills one contest at a
                            time.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <Button
                                size="lg"
                                variant="secondary"
                                className="gap-2 rounded-xl font-bold px-8 text-xs uppercase tracking-wider"
                                onClick={() => navigate('/register')}
                            >
                                Create Free Account{' '}
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                            <Button
                                size="lg"
                                variant="ghost"
                                className="gap-2 rounded-xl font-bold px-8 text-xs uppercase tracking-wider text-primary-foreground hover:text-primary-foreground hover:bg-white/10"
                                onClick={() => navigate('/login')}
                            >
                                Sign In
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function Home() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalContests: 0,
        totalProblems: 0,
        totalSubmissions: 0,
        upcomingContests: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/statistics')
            .then((res) => setStats(res.data.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <HeroSection stats={stats} loading={loading} />
            <StatsSection stats={stats} loading={loading} />
            <UpcomingContestsSection contests={stats.upcomingContests} />
            <FeaturesSection />
            <CTASection />
        </div>
    );
}
