import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Send, Loader2, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/axios';

const VALID_LANGUAGES = ['cpp', 'c', 'java', 'python', 'javascript'];
const PROBLEM_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function ContestSubmitTab() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const preselectedProblem = location.state?.preselectProblem || '';

    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        problem_id: preselectedProblem,
        language: 'cpp',
        source_code: ''
    });

    useEffect(() => {
        const fetchProblems = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/problems?contest_id=${id}`);
                const data = res.data.data || [];
                setProblems(data);
                
                // If not preselected, default to the first problem
                if (!preselectedProblem && data.length > 0) {
                    setForm(prev => ({ ...prev, problem_id: data[0].problem_id }));
                }
            } catch (err) {
                toast.error('Failed to load problems for submission.');
            } finally {
                setLoading(false);
            }
        };
        fetchProblems();
    }, [id, preselectedProblem]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.problem_id || !form.language || !form.source_code.trim()) {
            toast.error('Please fill in all fields.');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/submissions', {
                problem_id: form.problem_id,
                language: form.language,
                source_code: form.source_code
            });
            toast.success('Code submitted successfully!');
            navigate(`/contest/${id}/submissions`);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to submit code.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    if (problems.length === 0) {
        return (
            <div className="text-center py-16 border border-dashed rounded-xl bg-card">
                <Code2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="font-semibold mb-1">No Problems Available</h3>
                <p className="text-sm text-muted-foreground">You cannot submit code because there are no active problems.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-border bg-muted/20">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Send className="w-5 h-5 text-primary" />
                    Submit Code
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Select a problem, choose your language, and paste your source code.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                    {/* Problem Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Problem</label>
                        <select
                            value={form.problem_id}
                            onChange={(e) => setForm({ ...form, problem_id: Number(e.target.value) })}
                            className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                        >
                            <option value="" disabled>Select a problem</option>
                            {problems.map((prob, idx) => {
                                const letter = PROBLEM_LETTERS[idx] || idx + 1;
                                return (
                                    <option key={prob.problem_id} value={prob.problem_id}>
                                        {letter} - {prob.title}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Language Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Language</label>
                        <select
                            value={form.language}
                            onChange={(e) => setForm({ ...form, language: e.target.value })}
                            className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent capitalize"
                            required
                        >
                            {VALID_LANGUAGES.map((lang) => (
                                <option key={lang} value={lang}>{lang === 'cpp' ? 'C++' : lang}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Source Code */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Source Code</label>
                    <textarea
                        value={form.source_code}
                        onChange={(e) => setForm({ ...form, source_code: e.target.value })}
                        className="w-full min-h-[350px] p-4 text-sm font-mono rounded-md border border-input bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-colors"
                        placeholder="Paste your source code here..."
                        spellCheck="false"
                        required
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <Button type="submit" size="lg" disabled={submitting} className="gap-2 px-8">
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" /> Submit
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
