import {
    Outlet,
    NavLink,
    useParams,
    useNavigate,
    useLocation,
} from 'react-router-dom';
import {useState, useEffect} from 'react';
import {
    Trophy,
    Code,
    ListChecks,
    ArrowLeft,
    Loader2,
    BarChart2,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import api from '@/lib/axios';
import HelpPanel from '@/components/HelpPanel';

export default function ContestParticipationLayout() {
    const {id} = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [contest, setContest] = useState(null);
    const [problems, setProblems] = useState([]);
    const [solvedIds, setSolvedIds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [contestRes, problemsRes, solvedRes] = await Promise.all([
                    api.get(`/contests/${id}`),
                    api.get(`/problems?contest_id=${id}`),
                    api.get(`/submissions/solved?contest_id=${id}`),
                ]);
                setContest(contestRes.data.data);
                setProblems(problemsRes.data.data || []);
                setSolvedIds(solvedRes.data.data || []);
            } catch (err) {
                navigate('/contests');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground font-mono">
                    Loading contest...
                </p>
            </div>
        );
    }

    if (!contest) return null;

    const navItems = [
        {
            to: `/contest/${id}/problems`,
            label: 'Problems',
            icon: <Trophy className="w-4 h-4" />,
        },
        {
            to: `/contest/${id}/submissions`,
            label: 'Submissions',
            icon: <ListChecks className="w-4 h-4" />,
        },
        {
            to: `/contest/${id}/leaderboard`,
            label: 'Leaderboard',
            icon: <BarChart2 className="w-4 h-4" />,
        },
    ];

    const isProblemView = location.pathname.includes('/problem/');

    if (isProblemView) {
        return (
            <div className="flex-1 flex flex-col w-full bg-background min-h-0">
                <Outlet
                    context={{contest, problems, solvedIds, setSolvedIds}}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="bg-card border-b border-border">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/contests')}
                        className="gap-2 -ml-3 mb-4 text-xs font-semibold uppercase tracking-wider"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Contests
                    </Button>
                    <div className="flex items-center gap-3">
                        <div
                            className={`div-badge-${contest.division} flex items-center justify-center w-12 h-12 rounded-xl text-sm font-bold shrink-0`}
                        >
                            D{contest.division}
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                                {contest.title}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                By {contest.authored_by_name}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <nav className="flex items-center gap-6 overflow-x-auto">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({isActive}) =>
                                    `flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                                        isActive
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                                    }`
                                }
                            >
                                {item.icon}
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </div>

            <main className="flex-1 w-full mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-col">
                <Outlet
                    context={{contest, problems, solvedIds, setSolvedIds}}
                />
            </main>
        </div>
    );
}
