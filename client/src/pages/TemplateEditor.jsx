import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Editor from '@monaco-editor/react';
import { useTheme } from '@/components/theme-provider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const VALID_LANGUAGES = ['cpp', 'c', 'java', 'python', 'javascript'];

const LANG_LABEL = {
    cpp: 'C++',
    c: 'C',
    java: 'Java',
    python: 'Python',
    javascript: 'JavaScript',
};

export default function TemplateEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [template, setTemplate] = useState({
        title: '',
        source_code: '',
        language: 'cpp',
        is_default: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const { theme } = useTheme();
    const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const response = await api.get(`/user-templates/${id}`);
                setTemplate({
                    title: response.data.data.title || 'Untitled Template',
                    source_code: response.data.data.source_code,
                    language: response.data.data.language,
                    is_default: response.data.data.is_default === 1 || response.data.data.is_default === true
                });
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to load template.');
                navigate('/templates');
            } finally {
                setLoading(false);
            }
        };
        fetchTemplate();
    }, [id, navigate]);

    const handleSave = async (exitAfter = false) => {
        setSaving(true);
        try {
            await api.put(`/user-templates/${id}`, template);
            toast.success('Template saved successfully!');
            if (exitAfter) {
                navigate('/templates');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save template.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-full bg-background animate-in fade-in duration-500">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-sm z-10">
                <div className="flex items-center gap-4 flex-1">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/templates')} className="text-muted-foreground hover:text-foreground shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1 max-w-md">
                        <input
                            type="text"
                            value={template.title}
                            onChange={(e) => setTemplate({ ...template, title: e.target.value })}
                            className="text-lg font-bold tracking-tight text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none w-full px-1 py-0.5 transition-colors placeholder:text-muted-foreground/50"
                            placeholder="Template Title"
                            spellCheck={false}
                        />
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5 px-1">
                            ID: {id}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Language Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            Lang:
                        </span>
                        <select
                            value={template.language}
                            onChange={(e) => setTemplate({ ...template, language: e.target.value })}
                            className="text-sm bg-secondary border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {VALID_LANGUAGES.map(lang => (
                                <option key={lang} value={lang}>{LANG_LABEL[lang]}</option>
                            ))}
                        </select>
                    </div>

                    {/* Default Toggle */}
                    <div className="flex items-center gap-2 border-l border-border pl-6">
                        <Switch
                            id="default-switch"
                            checked={template.is_default}
                            onCheckedChange={(checked) => setTemplate({ ...template, is_default: checked })}
                        />
                        <Label htmlFor="default-switch" className="flex items-center gap-1.5 cursor-pointer">
                            <Star className={`w-4 h-4 ${template.is_default ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                            <span className="text-sm font-medium">Default Template</span>
                        </Label>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 border-l border-border pl-6">
                        <Button variant="outline" onClick={() => navigate('/templates')}>
                            Exit
                        </Button>
                        <Button onClick={() => handleSave(true)} disabled={saving} className="gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save & Exit
                        </Button>
                    </div>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative">
                <Editor
                    height="100%"
                    language={template.language === 'cpp' ? 'cpp' : template.language === 'javascript' ? 'javascript' : template.language === 'python' ? 'python' : template.language === 'java' ? 'java' : 'c'}
                    theme={editorTheme}
                    value={template.source_code}
                    onChange={(val) => setTemplate({ ...template, source_code: val || '' })}
                    options={{
                        minimap: { enabled: true },
                        fontSize: 15,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                        padding: { top: 16 }
                    }}
                    loading={
                        <div className="flex h-full items-center justify-center text-muted-foreground font-mono text-sm">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Loading editor...
                        </div>
                    }
                />
            </div>
        </div>
    );
}
