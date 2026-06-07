import {useState, useEffect} from 'react';
import {useParams, useNavigate, Link} from 'react-router-dom';
import {toast} from 'sonner';
import {
    Trophy,
    ChevronRight,
    Save,
    LogOut,
    Trash2,
    Calendar,
    Clock,
    FileText,
    AlertTriangle,
    Info,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import api from '@/lib/axios';
import {DIVISION_TIERS} from '@/constants/ratings';

export default function ContestEditPage() {
    const {id} = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new' || !id;

    const [form, setForm] = useState({
        title: '',
        description: '',
        division: '',
        contest_start_time: '',
        contest_end_time: '',
        ai_assistance: false,
    });
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [contestData, setContestData] = useState(null);

    const formatForDatetimeLocal = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    };

    useEffect(() => {
        if (isNew) return;
        const fetchContest = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/contests/${id}`);
                const c = res.data.data;
                setContestData(c);
                setForm({
                    title: c.title || '',
                    description: c.description || '',
                    division: String(c.division || ''),
                    contest_start_time: formatForDatetimeLocal(
                        c.contest_start_time
                    ),
                    contest_end_time: formatForDatetimeLocal(
                        c.contest_end_time
                    ),
                    ai_assistance: !!c.ai_assistance,
                });
            } catch (err) {
                toast.error(
                    err?.response?.data?.message || 'Failed to load contest.'
                );
                navigate('/design-contest');
            } finally {
                setLoading(false);
            }
        };
        fetchContest();
    }, [id, isNew, navigate]);

    const set = (field) => (e) =>
        setForm((p) => ({
            ...p,
            [field]:
                e?.target?.type === 'checkbox'
                    ? e.target.checked
                    : (e?.target?.value ?? e),
        }));

    const validate = () => {
        if (isNew && !form.title.trim()) {
            toast.error('Contest title is required.');
            return false;
        }
        if (!form.division) {
            toast.error('Please select a division.');
            return false;
        }
        if (!form.contest_start_time || !form.contest_end_time) {
            toast.error('Start and end times are required.');
            return false;
        }
        if (
            new Date(form.contest_start_time) >= new Date(form.contest_end_time)
        ) {
            toast.error('Start time must be before end time.');
            return false;
        }
        return true;
    };

    const handleSave = async (andContinue = false) => {
        if (!validate()) return;
        setSaving(true);
        try {
            let contestId = id;
            if (isNew) {
                const res = await api.post('/contests', {
                    title: form.title,
                    description: form.description || undefined,
                    division: Number(form.division),
                    contest_start_time: form.contest_start_time,
                    contest_end_time: form.contest_end_time,
                    ai_assistance: form.ai_assistance,
                });
                contestId = res.data.data.id;
                toast.success(`Contest "${form.title}" created!`);
            } else {
                await api.patch(`/contests/${id}`, {
                    description: form.description || undefined,
                    division: Number(form.division),
                    contest_start_time: form.contest_start_time,
                    contest_end_time: form.contest_end_time,
                    ai_assistance: form.ai_assistance,
                });
                toast.success('Contest updated successfully.');
            }

            if (andContinue) {
                navigate(`/design-contest/problems/${contestId}`);
            } else {
                navigate('/design-contest');
            }
        } catch (err) {
            toast.error(
                err?.response?.data?.message || 'Failed to save contest.'
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (
            !confirm(
                `Delete "${contestData?.title || form.title}"? This action cannot be undone.`
            )
        )
            return;
        setDeleting(true);
        try {
            await api.delete(`/contests/${id}`);
            toast.success('Contest deleted.');
            navigate('/design-contest');
        } catch (err) {
            toast.error(
                err?.response?.data?.message || 'Failed to delete contest.'
            );
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="border-b border-border bg-card/50">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                        <div className="skeleton h-8 w-48 rounded mb-2" />
                        <div className="skeleton h-4 w-72 rounded" />
                    </div>
                </div>
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="skeleton h-4 w-24 rounded" />
                            <div className="skeleton h-10 w-full rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b border-border bg-card/50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                    <nav className="flex items-center mb-4 font-mono text-xs">
                        <Link to="/design-contest" className="breadcrumb-link text-muted-foreground hover:text-foreground">
                            My Contests
                        </Link>
                        <span className="breadcrumb-sep mx-2 text-muted-foreground/50">›</span>
                        <span className="text-foreground font-medium">
                            {isNew
                                ? 'New Contest'
                                : contestData?.title || 'Edit Contest'}
                        </span>
                    </nav>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
                            <Trophy className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight text-foreground">
                                {isNew ? 'Create Contest' : 'Edit Contest'}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {isNew
                                    ? 'Set up contest metadata, then add problems and test cases.'
                                    : `Editing "${contestData?.title}"`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                <div className="space-y-8">
                    <section className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Contest Title
                            </h2>
                        </div>
                        {isNew ? (
                            <Input
                                id="contest-title"
                                placeholder="e.g. CodeCode Round #42 (Div. 2)"
                                value={form.title}
                                onChange={set('title')}
                                className="text-lg font-medium h-12"
                            />
                        ) : (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50 border border-border">
                                <span className="text-lg font-medium text-foreground">
                                    {contestData?.title}
                                </span>
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                    Read-only
                                </span>
                            </div>
                        )}
                        {!isNew && (
                            <p className="text-xs text-muted-foreground">
                                Contest title cannot be changed after creation.
                            </p>
                        )}
                    </section>

                    <section className="space-y-2">
                        <Label
                            htmlFor="contest-desc"
                            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
                        >
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            Description
                        </Label>
                        <Textarea
                            id="contest-desc"
                            rows={4}
                            placeholder="Describe your contest — rules, themes, difficulty focus…"
                            value={form.description}
                            onChange={set('description')}
                            className="resize-y"
                        />
                    </section>

                    <section className="space-y-2">
                        <Label
                            htmlFor="contest-division"
                            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
                        >
                            <Trophy className="w-4 h-4 text-muted-foreground" />
                            Division
                        </Label>
                        <Select
                            onValueChange={set('division')}
                            value={form.division}
                        >
                            <SelectTrigger
                                id="contest-division"
                                className="max-w-xs"
                            >
                                <SelectValue placeholder="Select division" />
                            </SelectTrigger>
                            <SelectContent>
                                {DIVISION_TIERS.map(({v, label, desc}) => (
                                    <SelectItem key={v} value={v}>
                                        <span>{label}</span>
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            ({desc})
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.division && (
                            <div className="flex items-center gap-2 mt-1">
                                <div
                                    className={`div-badge-${form.division} text-xs font-bold px-2.5 py-1 rounded-md`}
                                >
                                    Div. {form.division}
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="ai-assistance"
                                checked={form.ai_assistance}
                                onChange={set('ai_assistance')}
                                className="w-4 h-4 rounded border-border"
                            />
                            <Label
                                htmlFor="ai-assistance"
                                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 cursor-pointer"
                            >
                                Allow AI Assistance
                                <div className="group relative flex items-center">
                                    <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 bg-popover text-popover-foreground text-[10px] rounded-md shadow-md p-2 z-10 border border-border">
                                        Give users access to Deco, coding
                                        assistant tool during the contest
                                    </div>
                                </div>
                            </Label>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            Schedule
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="contest-start"
                                    className="text-xs flex items-center gap-1.5"
                                >
                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                    Start Time
                                </Label>
                                <Input
                                    id="contest-start"
                                    type="datetime-local"
                                    value={form.contest_start_time}
                                    onChange={set('contest_start_time')}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="contest-end"
                                    className="text-xs flex items-center gap-1.5"
                                >
                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                    End Time
                                </Label>
                                <Input
                                    id="contest-end"
                                    type="datetime-local"
                                    value={form.contest_end_time}
                                    onChange={set('contest_end_time')}
                                />
                            </div>
                        </div>
                        {form.contest_start_time && form.contest_end_time && (
                            <p className="text-xs text-muted-foreground font-mono">
                                Duration:{' '}
                                {(() => {
                                    const dur =
                                        (new Date(form.contest_end_time) -
                                            new Date(form.contest_start_time)) /
                                        60000;
                                    if (dur <= 0) return '—';
                                    return dur >= 60
                                        ? `${Math.floor(dur / 60)} hours ${dur % 60 ? `${dur % 60} minutes` : ''}`
                                        : `${dur} minutes`;
                                })()}
                            </p>
                        )}
                    </section>

                    {!isNew && (
                        <section className="pt-4 border-t border-border">
                            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            Danger Zone
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Deleting this contest will remove
                                            all its problems and test cases.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    id="delete-contest-btn"
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="gap-1.5 shrink-0 text-xs font-semibold uppercase tracking-wider"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {deleting ? 'Deleting…' : 'Delete'}
                                </Button>
                            </div>
                        </section>
                    )}

                    <div className="flex items-center justify-between pt-6 border-t border-border">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/design-contest')}
                            className="gap-2 text-xs font-semibold uppercase tracking-wider"
                        >
                            <LogOut className="w-4 h-4" />
                            Cancel
                        </Button>
                        <div className="flex gap-3">
                            <Button
                                id="save-exit"
                                variant="outline"
                                onClick={() => handleSave(false)}
                                disabled={saving}
                                className="gap-2 text-xs font-semibold uppercase tracking-wider"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving…' : 'Save & Exit'}
                            </Button>
                            <Button
                                id="save-continue"
                                onClick={() => handleSave(true)}
                                disabled={saving}
                                className="gap-2 text-xs font-semibold uppercase tracking-wider"
                            >
                                {saving ? 'Saving…' : 'Save & Continue'}
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
