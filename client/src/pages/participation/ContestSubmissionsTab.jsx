import {useState, useEffect, useCallback} from 'react';
import {useParams, useOutletContext, useLocation} from 'react-router-dom';
import {toast} from 'sonner';
import {RefreshCcw, Loader2, Code2, ListChecks} from 'lucide-react';
import {Button} from '@/components/ui/button';
import api from '@/lib/axios';
import {getVerdictDetails} from '@/constants/verdicts';

function formatDate(iso) {
    return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
}

export default function ContestSubmissionsTab() {
    const {id} = useParams();
    const location = useLocation();
    const {problems} = useOutletContext();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const autoRefresh = location.state?.autoRefresh;

    const fetchSubmissions = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else if (submissions.length === 0) setLoading(true);

        try {
            const res = await api.get(`/submissions?contest_id=${id}`);
            setSubmissions(res.data.data || []);
        } catch (err) {
            toast.error('Failed to load submissions.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();

        let intervalId;
        let timeoutId;

        if (autoRefresh) {
            // Auto refresh every 5 seconds
            intervalId = setInterval(() => {
                fetchSubmissions(true);
            }, 5000);

            // Stop auto-refresh after 30 seconds
            timeoutId = setTimeout(() => {
                clearInterval(intervalId);
            }, 30000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [id, autoRefresh]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-primary" />
                    My Submissions
                </h2>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchSubmissions(true)}
                    disabled={refreshing || loading}
                    className="gap-2"
                >
                    <RefreshCcw
                        className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
                    />
                    {refreshing ? 'Reloading...' : 'Reload Submissions'}
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12 border border-border rounded-xl bg-card">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            ) : submissions.length === 0 ? (
                <div className="text-center py-16 border border-dashed rounded-xl bg-card">
                    <Code2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">No Submissions Yet</h3>
                    <p className="text-sm text-muted-foreground">
                        You haven't submitted any code for this contest.
                    </p>
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-muted/40 border-b border-border">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Time
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                                    Language
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                                    Verdict
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                                    Time
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                                    Memory
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {submissions.map((sub) => (
                                <tr
                                    key={sub.submission_id}
                                    className="hover:bg-muted/30 transition-colors"
                                >
                                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                                        #{sub.submission_id}
                                    </td>
                                    <td className="px-6 py-3 text-sm">
                                        {formatDate(sub.submitted_at)}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-center capitalize">
                                        {sub.language === 'cpp'
                                            ? 'C++'
                                            : sub.language}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        {(() => {
                                            const v = getVerdictDetails(
                                                sub.verdict
                                            );
                                            return (
                                                <span
                                                    className={`inline-flex px-2 py-1 rounded text-xs ${v.colorClass}`}
                                                >
                                                    {v.label}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-center font-mono">
                                        {sub.execution_time_ms != null
                                            ? `${sub.execution_time_ms} ms`
                                            : '-'}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-center font-mono">
                                        {sub.memory_used_kb != null
                                            ? `${sub.memory_used_kb} KB`
                                            : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
