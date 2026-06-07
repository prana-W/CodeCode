import {useState, useEffect} from 'react';
import {useParams, useNavigate, useOutletContext} from 'react-router-dom';
import {toast} from 'sonner';
import {Trophy, FileText, CheckCircle2, Loader2, BarChart2} from 'lucide-react';
import api from '@/lib/axios';

const PROBLEM_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function ContestProblemsTab() {
    const {id} = useParams();
    const {problems} = useOutletContext();
    const navigate = useNavigate();
    const [countsMap, setCountsMap] = useState({}); // { problem_id: count }
    const [solvedSet, setSolvedSet] = useState(new Set());

    useEffect(() => {
        const fetchSolved = async () => {
            try {
                const res = await api.get(
                    `/submissions/solved?contest_id=${id}`
                );
                setSolvedSet(new Set(res.data.data || []));
            } catch (err) {
                // Ignore silent error
            }
        };
        fetchSolved();
    }, [id]);

    useEffect(() => {
        const fetchCounts = async () => {
            if (problems.length === 0) return;
            try {
                const res = await api.get(
                    `/submissions/counts?contest_id=${id}`
                );
                const data = res.data.data || [];
                const newMap = {};
                data.forEach((item) => {
                    newMap[item.problem_id] = item.total_submissions;
                });
                setCountsMap(newMap);
            } catch (err) {
                // Ignore silent errors for polling
            }
        };

        fetchCounts();
        const interval = setInterval(fetchCounts, 60000); // Auto-update every 1 minute
        return () => clearInterval(interval);
    }, [id, problems]);

    if (!problems || problems.length === 0) {
        return (
            <div className="text-center py-16 border border-dashed rounded-xl bg-card">
                <Trophy className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="font-semibold mb-1">No Problems Yet</h3>
                <p className="text-sm text-muted-foreground">
                    This contest currently has no active problems.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-muted/40 border-b border-border">
                    <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16 text-center">
                            #
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Problem Name
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32 text-center">
                            <span className="flex items-center justify-center gap-1.5">
                                <BarChart2 className="w-3.5 h-3.5" />
                                Submissions
                            </span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {problems.map((prob, idx) => {
                        const letter = PROBLEM_LETTERS[idx] || idx + 1;
                        const submissions = countsMap[prob.problem_id] || 0;
                        const isSolved = solvedSet.has(prob.problem_id);
                        return (
                            <tr
                                key={prob.problem_id}
                                onClick={() =>
                                    navigate(
                                        `/contest/${id}/problem/${prob.problem_id}`
                                    )
                                }
                                className="group hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-4 text-center relative">
                                    {isSolved && (
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        </div>
                                    )}
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded font-bold text-sm bg-primary/10 text-primary">
                                        {letter}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                        {prob.title}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-muted-foreground">
                                            Time limit: {prob.time_limit_ms} ms
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Memory: {prob.memory_limit_mb} MB
                                        </span>
                                        <span className="text-xs text-muted-foreground font-medium text-amber-600">
                                            {prob.score} pts
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground">
                                        {submissions}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
