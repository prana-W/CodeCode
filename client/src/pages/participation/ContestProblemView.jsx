import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { Code, Clock, Database, ChevronLeft, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/axios';
import MDEditor from '@uiw/react-md-editor';

export default function ContestProblemView() {
    const { id, problemId } = useParams();
    const navigate = useNavigate();
    const { contest } = useOutletContext();
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProblem = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/problems/${problemId}`);
                setProblem(res.data.data);
            } catch (err) {
                toast.error('Failed to load problem details.');
                navigate(`/contest/${id}/problems`);
            } finally {
                setLoading(false);
            }
        };
        fetchProblem();
    }, [id, problemId, navigate]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    if (!problem) return null;

    return (
        <div className="space-y-6">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(`/contest/${id}/problems`)} 
                className="gap-2 -ml-3"
            >
                <ChevronLeft className="w-4 h-4" /> Back to Problems
            </Button>

            <div className="bg-card border border-border rounded-xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-border pb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold mb-3">{problem.title}</h1>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
                                <Clock className="w-4 h-4" />
                                {problem.time_limit_ms} ms
                            </span>
                            <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
                                <Database className="w-4 h-4" />
                                {problem.memory_limit_mb} MB
                            </span>
                            <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 font-medium px-2.5 py-1 rounded-md">
                                {problem.score} Points
                            </span>
                        </div>
                    </div>
                    
                    <Button 
                        size="lg" 
                        className="gap-2 shrink-0 w-full md:w-auto"
                        onClick={() => navigate(`/contest/${id}/submit`, { state: { preselectProblem: problem.problem_id } })}
                    >
                        <Code className="w-4 h-4" />
                        Submit Code
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary">
                    <MDEditor.Markdown source={problem.statement} />
                </div>
                
                {problem.explanation && (
                    <div className="mt-12 pt-8 border-t border-border">
                        <h3 className="text-lg font-bold mb-4 uppercase tracking-wide text-muted-foreground">Note</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                            <MDEditor.Markdown source={problem.explanation} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
