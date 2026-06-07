import { useState, useRef, useEffect } from 'react';
import {
    HelpCircle, Send, Sparkles, BookOpen,
    Loader2, X
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/axios';

export default function HelpPanel({ contest }) {
    const isPastEnd = contest && new Date(contest.contest_end_time) < new Date();
    const allowAI = contest ? (isPastEnd || contest.ai_assistance) : false;

    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(allowAI ? 'ai' : 'wiki'); // 'ai' | 'wiki'

    useEffect(() => {
        if (!allowAI && activeTab === 'ai') {
            setActiveTab('wiki');
        }
    }, [allowAI, activeTab]);

    // AI Chat State
    const [messages, setMessages] = useState([
        { sender: 'assistant', text: "Hello! I am Deco, your coding assistant. Ask me for hints or help with coding concepts!" }
    ]);
    const [aiInput, setAiInput] = useState('');
    const [loadingAi, setLoadingAi] = useState(false);
    const messagesEndRef = useRef(null);
    const panelRef = useRef(null);
    const buttonRef = useRef(null);

    // Auto-scroll AI chat
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Handle click outside to close panel
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                panelRef.current &&
                !panelRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSendAi = async (e) => {
        if (e) e.preventDefault();
        const text = aiInput.trim();
        if (!text || loadingAi) return;

        // Add user message
        const userMsg = { sender: 'user', text };
        setMessages(prev => [...prev, userMsg]);
        setAiInput('');
        setLoadingAi(true);

        try {
            const res = await api.post('/ai/ask', { prompt: text });
            const replyText = res.data?.data?.hint || "Sorry, I couldn't generate a hint.";
            setMessages(prev => [...prev, { sender: 'assistant', text: replyText }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                sender: 'assistant',
                text: "Error: Failed to connect to the assistant. Ensure Ollama is running."
            }]);
        } finally {
            setLoadingAi(false);
        }
    };



    return (
        <>
            {/* Floating Help Button */}
            <div className="fixed bottom-6 left-6 z-50">
                <Button
                    ref={buttonRef}
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center bg-primary hover:bg-primary/95 text-primary-foreground transition-all duration-300 transform hover:scale-105"
                >
                    {isOpen ? <X className="w-6 h-6 animate-in fade-in zoom-in" /> : <HelpCircle className="w-6 h-6 animate-in fade-in zoom-in" />}
                </Button>
            </div>

            {/* Help Panel Window */}
            {isOpen && (
                <Card
                    ref={panelRef}
                    className="fixed bottom-24 left-4 sm:left-6 z-50 w-[calc(100vw-2rem)] sm:w-[600px] md:w-[750px] lg:w-[900px] h-[75vh] max-h-[750px] min-h-[450px] bg-card border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300"
                >
                    {/* Navigation Tabs */}
                    <div className="flex border-b border-border bg-muted/10 shrink-0">
                        {!!allowAI && (
                            <button
                                onClick={() => setActiveTab('ai')}
                                className={`flex-1 pt-1 pb-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'ai'
                                    ? 'border-primary text-primary bg-background/50'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                AI Assistant
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('wiki')}
                            className={`flex-1 pt-1 pb-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'wiki'
                                ? 'border-primary text-primary bg-background/50'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            Wikipedia
                        </button>
                    </div>

                    {/* Tab Content Area */}
                    <div className="flex-1 overflow-hidden relative flex flex-col bg-card">

                        {/* Tab 1: AI Assistant */}
                        {!!allowAI && activeTab === 'ai' && (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                                    {messages.map((msg, i) => (
                                        <div
                                            key={i}
                                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed ${msg.sender === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                : 'bg-muted/80 text-foreground rounded-tl-none border border-border'
                                                }`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                    {loadingAi && (
                                        <div className="flex justify-start">
                                            <div className="bg-muted/80 text-foreground border border-border rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-sm flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                <span>Assistant is writing...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form onSubmit={handleSendAi} className="p-3 border-t border-border bg-muted/20 flex gap-2 shrink-0">
                                    <Input
                                        value={aiInput}
                                        onChange={(e) => setAiInput(e.target.value)}
                                        placeholder="Ask a question or request a hint..."
                                        disabled={loadingAi}
                                        className="flex-1 bg-background border-border"
                                    />
                                    <Button type="submit" disabled={loadingAi || !aiInput.trim()} size="icon">
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                            </div>
                        )}

                        {/* Tab 2: Wikipedia */}
                        {activeTab === 'wiki' && (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <iframe
                                    src="https://en.m.wikipedia.org/wiki/Competitive_programming"
                                    title="Wikipedia"
                                    className="w-full flex-1 border-0 bg-white dark:bg-zinc-900"
                                />
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </>
    );
}
