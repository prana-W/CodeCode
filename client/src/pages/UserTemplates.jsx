import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { FileCode2, Plus, Star, Trash2, Edit, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function UserTemplates() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasOngoing, setHasOngoing] = useState(false);
    const navigate = useNavigate();

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const [templatesRes, statusRes] = await Promise.all([
                api.get('/user-templates'),
                api.get('/user-templates/ongoing-contest-status')
            ]);
            setTemplates(templatesRes.data.data);
            setHasOngoing(statusRes.data.data.hasOngoing);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load templates.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleCreateNew = async () => {
        try {
            const response = await api.post('/user-templates', {
                title: 'Untitled Template',
                source_code: '// Enter your template code here\n',
                language: 'cpp',
                is_default: false
            });
            const newId = response.data.data.template_id;
            toast.success('Template created!');
            navigate(`/templates/${newId}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create template.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await api.delete(`/user-templates/${id}`);
            toast.success('Template deleted successfully.');
            setTemplates(templates.filter(t => t.template_id !== id));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete template.');
        }
    };

    const handleSetDefault = async (id) => {
        try {
            await api.put(`/user-templates/${id}/default`);
            toast.success('Default template updated.');
            fetchTemplates();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update default template.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <FileCode2 className="w-8 h-8 text-primary" />
                        Code Templates
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your code templates. Mark one as default to use it across the platform.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {hasOngoing && (
                        <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-md text-xs font-medium">
                            <Info className="w-4 h-4" />
                            <span>A contest is currently ongoing. Kindly wait for it to finish before creating/updating templates.</span>
                        </div>
                    )}
                    <Button onClick={handleCreateNew} className="gap-2" disabled={hasOngoing}>
                        <Plus className="w-4 h-4" />
                        New Template
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <span className="text-muted-foreground animate-pulse">Loading templates...</span>
                </div>
            ) : templates.length === 0 ? (
                <Card className="text-center py-12 bg-muted/20 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center">
                        <FileCode2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium text-foreground">No templates yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm text-sm">
                            Create your first template to speed up your coding sessions.
                        </p>
                        <Button onClick={handleCreateNew} disabled={hasOngoing}>Create Template</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <Card key={template.template_id} className={`flex flex-col overflow-hidden transition-all hover:shadow-md ${template.is_default ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
                            <CardHeader className="pb-3 bg-muted/30">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1.5">
                                        <h3 className="font-semibold text-lg line-clamp-1">{template.title}</h3>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={template.is_default ? "default" : "secondary"} className="uppercase tracking-widest text-[10px]">
                                                {template.language}
                                            </Badge>
                                            {!!template.is_default && (
                                                <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-primary tracking-widest">
                                                    <Star className="w-3 h-3 fill-primary" />
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                            onClick={() => navigate(`/templates/${template.template_id}`)}
                                            disabled={hasOngoing}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                            onClick={() => handleDelete(template.template_id)}
                                            disabled={hasOngoing}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 pt-4">
                                <pre className="text-xs font-mono text-muted-foreground bg-muted p-3 rounded-md overflow-hidden h-32 text-ellipsis">
                                    {template.source_code}
                                </pre>
                            </CardContent>
                            <CardFooter className="pt-2 border-t bg-muted/10 flex justify-between items-center">
                                {!template.is_default && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs gap-1.5"
                                        onClick={() => handleSetDefault(template.template_id)}
                                        disabled={hasOngoing}
                                    >
                                        <Star className="w-3.5 h-3.5" />
                                        Set Default
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
