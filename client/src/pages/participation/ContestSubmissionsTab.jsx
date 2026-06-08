import {useState, useEffect} from 'react';
import {useParams, useOutletContext, useLocation} from 'react-router-dom';
import {toast} from 'sonner';
import {RefreshCcw, Loader2, Code2, ListChecks, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import api from '@/lib/axios';
import {getVerdictDetails} from '@/constants/verdicts';
import Editor from '@monaco-editor/react';
import {useSocket} from '@/context/SocketContext';

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

    const [selectedSubId, setSelectedSubId] = useState(null);
    const [subDetails, setSubDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const {socket} = useSocket();

    const autoRefresh = location.state?.autoRefresh;

    const getProblemLetter = (problemId) => {
        if (!problems) return '';
        const idx = problems.findIndex((p) => p.problem_id === problemId);
        if (idx !== -1) {
            return String.fromCharCode(65 + idx) + '.';
        }
        return '';
    };

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

    const handleRowClick = async (subId) => {
        setSelectedSubId(subId);
        setSubDetails(null);
        setLoadingDetails(true);
        try {
            const res = await api.get(`/submissions/${subId}`);
            setSubDetails(res.data.data);
        } catch (err) {
            toast.error('Failed to load submission details.');
            setSelectedSubId(null);
        } finally {
            setLoadingDetails(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, [id]);

    useEffect(() => {
        if (!socket) return;

        const handleSubmissionUpdate = (data) => {
            setSubmissions((prev) =>
                prev.map((sub) => {
                    if (sub.submission_id === data.submission_id) {
                        return {
                            ...sub,
                            verdict: data.verdict,
                            execution_time_ms: data.execution_time_ms,
                            memory_used_kb: data.memory_used_kb,
                        };
                    }
                    return sub;
                })
            );

            // Also update modal if it's currently open
            setSubDetails((prev) => {
                if (prev && prev.submission_id === data.submission_id) {
                    return {
                        ...prev,
                        verdict: data.verdict,
                        execution_time_ms: data.execution_time_ms,
                        memory_used_kb: data.memory_used_kb,
                    };
                }
                return prev;
            });
        };

        socket.on('submission_update', handleSubmissionUpdate);
        return () => {
            socket.off('submission_update', handleSubmissionUpdate);
        };
    }, [socket]);

    useEffect(() => {
        if (selectedSubId) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedSubId]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-serif font-semibold flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-primary" />
                    My Submissions
                </h2>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchSubmissions(true)}
                    disabled={refreshing || loading}
                    className="gap-2 text-xs font-semibold uppercase tracking-wider"
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
                                    Problem
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Time Submitted
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                                    Language
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                                    Verdict
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {submissions.map((sub) => (
                                <tr
                                    key={sub.submission_id}
                                    onClick={() =>
                                        handleRowClick(sub.submission_id)
                                    }
                                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-3 font-semibold text-sm text-foreground">
                                        <span className="mr-1.5 text-primary">
                                            {getProblemLetter(sub.problem_id)}
                                        </span>
                                        {sub.problem_title ||
                                            `Problem #${sub.problem_id}`}
                                    </td>
                                    <td className="px-6 py-3 text-xs font-mono text-muted-foreground">
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
                                                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold font-mono ${v.colorClass}`}
                                                >
                                                    {v.label}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedSubId && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
                    onClick={() => setSelectedSubId(null)}
                >
                    <div
                        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <Code2 className="w-4 h-4 text-primary" />
                                {subDetails?.problem_title
                                    ? `Submission for: ${subDetails.problem_title}`
                                    : `Submission #${selectedSubId}`}
                            </h3>
                            <button
                                onClick={() => setSelectedSubId(null)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 flex-1 overflow-auto bg-muted/10">
                            {loadingDetails ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : subDetails ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 text-sm font-mono flex-wrap bg-background p-3 rounded-lg border border-border">
                                        <div>
                                            <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
                                                Verdict
                                            </span>
                                            <p className="mt-1">
                                                {(() => {
                                                    const v = getVerdictDetails(
                                                        subDetails.verdict
                                                    );
                                                    return (
                                                        <span
                                                            className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${v.colorClass}`}
                                                        >
                                                            {v.label}
                                                        </span>
                                                    );
                                                })()}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
                                                Language
                                            </span>
                                            <p className="mt-1 font-semibold">
                                                {subDetails.language === 'cpp'
                                                    ? 'C++'
                                                    : subDetails.language}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
                                                Time
                                            </span>
                                            <p className="mt-1 font-semibold">
                                                {subDetails.execution_time_ms !=
                                                null
                                                    ? `${subDetails.execution_time_ms} ms`
                                                    : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
                                                Memory
                                            </span>
                                            <p className="mt-1 font-semibold">
                                                {subDetails.memory_used_kb !=
                                                null
                                                    ? `${subDetails.memory_used_kb} KB`
                                                    : '-'}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground uppercase tracking-wider text-[10px] mb-2 block">
                                            Source Code
                                        </span>
                                        <div className="border border-border rounded-lg overflow-hidden h-[50vh]">
                                            <Editor
                                                height="100%"
                                                language={
                                                    subDetails.language ===
                                                        'c' ||
                                                    subDetails.language ===
                                                        'cpp'
                                                        ? 'cpp'
                                                        : subDetails.language ===
                                                            'python'
                                                          ? 'python'
                                                          : subDetails.language ===
                                                              'java'
                                                            ? 'java'
                                                            : 'javascript'
                                                }
                                                value={subDetails.source_code}
                                                theme="vs-dark"
                                                options={{
                                                    readOnly: true,
                                                    minimap: {enabled: false},
                                                    scrollBeyondLastLine: false,
                                                    fontSize: 14,
                                                    lineNumbers: 'on',
                                                    wordWrap: 'on',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground text-sm">
                                    Failed to load details
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
