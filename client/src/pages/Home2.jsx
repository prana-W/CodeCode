import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Code2, Trophy, Zap, Users, Star, ArrowRight, Menu, X,
    Github, Twitter, Linkedin, Globe, Eye, TrendingUp,
    LogIn, UserPlus, LogOut, ChevronDown, Target, Award, Clock
} from 'lucide-react';

// ─── Mock Auth State (replace with real context later) ───────────────────────
const useMockAuth = () => {
    const [user, setUser] = useState(null); // null = logged out
    const login = () => setUser({ name: 'Pranav', rating: 1842 });
    const logout = () => setUser(null);
    return { user, login, logout };
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = ({ user, onLogin, onLogout }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, []);

    const navLinks = [
        { label: 'Home', href: '#home' },
        { label: 'Contests', href: '#contests' },
        { label: 'Design Contest', href: '#design' },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled
                    ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-sm'
                    : 'bg-transparent'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <a href="#home" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
                            <Code2 className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-foreground">
                            Code<span className="text-primary opacity-70">Code</span>
                        </span>
                    </a>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Desktop Auth */}
                    <div className="hidden md:flex items-center gap-2">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                        {user.name[0]}
                                    </div>
                                    {user.name}
                                    <span className="text-xs text-muted-foreground">#{user.rating}</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={onLogout} className="gap-2">
                                    <LogOut className="w-4 h-4" /> Logout
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" onClick={onLogin} className="gap-2">
                                    <LogIn className="w-4 h-4" /> Login
                                </Button>
                                <Button size="sm" onClick={onLogin} className="gap-2">
                                    <UserPlus className="w-4 h-4" /> Register
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden bg-background/98 backdrop-blur-md border-b border-border">
                    <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="px-4 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                onClick={() => setMenuOpen(false)}
                            >
                                {link.label}
                            </a>
                        ))}
                        <div className="border-t border-border my-1 pt-3 flex flex-col gap-2">
                            {user ? (
                                <Button variant="outline" size="sm" onClick={onLogout} className="justify-start gap-2">
                                    <LogOut className="w-4 h-4" /> Logout
                                </Button>
                            ) : (
                                <>
                                    <Button variant="outline" size="sm" onClick={onLogin} className="justify-start gap-2">
                                        <LogIn className="w-4 h-4" /> Login
                                    </Button>
                                    <Button size="sm" onClick={onLogin} className="justify-start gap-2">
                                        <UserPlus className="w-4 h-4" /> Register
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

// ─── Header / Hero ────────────────────────────────────────────────────────────
const HeroHeader = ({ user, onLogin }) => {
    const stats = [
        { label: 'Active Coders', value: '12,400+', icon: Users },
        { label: 'Contests Run', value: '340+', icon: Trophy },
        { label: 'Problems Solved', value: '1.2M+', icon: Zap },
    ];

    return (
        <header
            id="home"
            className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16"
            style={{
                background:
                    'radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.205 0 0 / 8%), transparent), ' +
                    'linear-gradient(180deg, oklch(0.97 0 0) 0%, oklch(1 0 0) 100%)',
            }}
        >
            {/* Decorative grid */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        'linear-gradient(oklch(0.922 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.922 0 0) 1px, transparent 1px)',
                    backgroundSize: '64px 64px',
                    maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 80%)',
                }}
            />

            {/* Glow orbs */}
            <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full opacity-[0.07] bg-foreground blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full opacity-[0.05] bg-foreground blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background/80 backdrop-blur text-xs font-medium text-muted-foreground mb-8 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Competitive Programming Platform
                    <ArrowRight className="w-3 h-3" />
                </div>

                <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
                    Code. Compete.
                    <br />
                    <span
                        className="text-transparent bg-clip-text"
                        style={{ backgroundImage: 'linear-gradient(135deg, oklch(0.3 0 0), oklch(0.6 0 0))' }}
                    >
                        Conquer.
                    </span>
                </h1>

                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                    Join thousands of developers sharpening their skills through real-time coding contests,
                    design challenges, and a thriving community of problem-solvers.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                    {user ? (
                        <Button size="lg" className="gap-2 px-8 h-12 text-base font-semibold shadow-lg">
                            <Trophy className="w-5 h-5" /> Browse Contests
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    ) : (
                        <>
                            <Button
                                size="lg"
                                onClick={onLogin}
                                className="gap-2 px-8 h-12 text-base font-semibold shadow-lg"
                            >
                                <UserPlus className="w-5 h-5" /> Get Started Free
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={onLogin}
                                className="gap-2 px-8 h-12 text-base font-semibold"
                            >
                                <LogIn className="w-5 h-5" /> Sign In
                            </Button>
                        </>
                    )}
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                    {stats.map(({ label, value, icon: Icon }) => (
                        <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-background/70 border border-border backdrop-blur shadow-sm">
                            <Icon className="w-4 h-4 text-muted-foreground mb-1" />
                            <span className="text-xl font-bold text-foreground">{value}</span>
                            <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </div>
        </header>
    );
};

// ─── Features Section ─────────────────────────────────────────────────────────
const FeaturesSection = () => {
    const features = [
        {
            icon: Trophy,
            title: 'Live Contests',
            desc: 'Compete in real-time with participants worldwide. Climb the leaderboard and earn your ranking.',
        },
        {
            icon: Target,
            title: 'Design Contests',
            desc: 'Showcase your UI/UX skills in curated design challenges judged by industry professionals.',
        },
        {
            icon: TrendingUp,
            title: 'Elo Rating System',
            desc: 'A fair, dynamic rating system that accurately reflects your skill progression over time.',
        },
        {
            icon: Clock,
            title: 'Practice Arena',
            desc: 'Train on hundreds of curated problems across all difficulty levels at your own pace.',
        },
        {
            icon: Award,
            title: 'Achievements',
            desc: 'Unlock badges and certificates to showcase your accomplishments to future employers.',
        },
        {
            icon: Users,
            title: 'Community',
            desc: 'Discuss solutions, share insights, and learn collaboratively with a global community.',
        },
    ];

    return (
        <section className="py-24 px-4 bg-background">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                        What We Offer
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                        Everything you need to level up
                    </h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        From beginner-friendly practice to elite-level competitions, CodeCode has the tools to take you further.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map(({ icon: Icon, title, desc }) => (
                        <Card
                            key={title}
                            className="group border border-border hover:border-foreground/20 transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-default"
                        >
                            <CardHeader>
                                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <CardTitle className="text-base">{title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-sm leading-relaxed">{desc}</CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

// ─── Contests Section ─────────────────────────────────────────────────────────
const ContestsSection = () => {
    const contests = [
        { id: 1, title: 'Weekly Clash #47', type: 'Algorithm', status: 'Live', participants: 234, time: 'Ends in 2h 14m', difficulty: 'Medium' },
        { id: 2, title: 'Grand Prix Round 12', type: 'Algorithm', status: 'Upcoming', participants: 891, time: 'Starts in 3 days', difficulty: 'Hard' },
        { id: 3, title: 'Beginner Blitz', type: 'Algorithm', status: 'Upcoming', participants: 412, time: 'Starts in 1 day', difficulty: 'Easy' },
    ];

    const statusColors = {
        Live: 'bg-foreground text-background',
        Upcoming: 'bg-secondary text-secondary-foreground',
        Ended: 'bg-muted text-muted-foreground',
    };

    const difficultyColors = {
        Easy: 'text-foreground/60',
        Medium: 'text-foreground/80',
        Hard: 'text-foreground',
    };

    return (
        <section id="contests" className="py-24 px-4 bg-secondary/30">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
                    <div>
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                            Compete
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Active Contests</h2>
                    </div>
                    <Button variant="outline" className="gap-2">
                        View All <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex flex-col gap-4">
                    {contests.map((c) => (
                        <div
                            key={c.id}
                            className="group flex items-center gap-4 p-5 rounded-xl bg-background border border-border hover:border-foreground/20 hover:shadow-md transition-all duration-200 cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="font-semibold text-foreground">{c.title}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status]}`}>
                                        {c.status === 'Live' && '● '}{c.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.time}</span>
                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.participants} registered</span>
                                    <span className={`font-medium ${difficultyColors[c.difficulty]}`}>{c.difficulty}</span>
                                </div>
                            </div>
                            <Button size="sm" variant={c.status === 'Live' ? 'default' : 'outline'} className="shrink-0">
                                {c.status === 'Live' ? 'Join Now' : 'Register'}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// ─── Design Contest Section ───────────────────────────────────────────────────
const DesignContestSection = () => {
    const contests = [
        { id: 1, title: 'Dashboard Redesign Challenge', theme: 'SaaS Analytics', prize: '$500', deadline: '5 days left', entries: 48 },
        { id: 2, title: 'Mobile-First Login Flow', theme: 'Fintech', prize: '$300', deadline: '12 days left', entries: 29 },
    ];

    return (
        <section id="design" className="py-24 px-4 bg-background">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
                    <div>
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                            Design
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Design Contests</h2>
                        <p className="text-muted-foreground mt-2 max-w-md">
                            Put your design skills to the test. Create stunning UIs and win prizes.
                        </p>
                    </div>
                    <Button variant="outline" className="gap-2">
                        View All <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                    {contests.map((c) => (
                        <Card key={c.id} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-border hover:border-foreground/20 overflow-hidden">
                            <div className="h-2 bg-primary w-full" />
                            <CardHeader>
                                <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="text-base leading-snug">{c.title}</CardTitle>
                                    <span className="px-2 py-1 bg-secondary rounded-md text-xs font-bold text-secondary-foreground shrink-0">{c.prize}</span>
                                </div>
                                <CardDescription>{c.theme}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.deadline}</span>
                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.entries} entries</span>
                                </div>
                                <Button size="sm" className="w-full gap-2">
                                    Submit Design <ArrowRight className="w-3 h-3" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

// ─── Footer ───────────────────────────────────────────────────────────────────
const FooterComponent = () => {
    const visitors = [
        { country: '🇮🇳 India', count: '4,821' },
        { country: '🇺🇸 United States', count: '3,204' },
        { country: '🇧🇩 Bangladesh', count: '1,987' },
        { country: '🇵🇰 Pakistan', count: '1,543' },
        { country: '🇩🇪 Germany', count: '982' },
        { country: '🇧🇷 Brazil', count: '741' },
    ];

    const links = {
        Platform: ['Contests', 'Design Contests', 'Practice', 'Leaderboard'],
        Community: ['Discord', 'Forum', 'Blog', 'Newsletter'],
        Company: ['About', 'Careers', 'Privacy', 'Terms'],
    };

    return (
        <footer className="bg-foreground text-background pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-12">
                    {/* Brand + Visitors */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-background/10 flex items-center justify-center">
                                <Code2 className="w-4 h-4 text-background" />
                            </div>
                            <span className="text-xl font-bold">CodeCode</span>
                        </div>
                        <p className="text-background/60 text-sm leading-relaxed mb-6 max-w-xs">
                            The competitive programming platform built for developers who want to grow, compete, and connect.
                        </p>

                        {/* Visitors Section */}
                        <div className="bg-background/5 border border-background/10 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Eye className="w-4 h-4 text-background/70" />
                                <span className="text-sm font-semibold text-background">Visitor Stats</span>
                                <span className="ml-auto text-xs text-background/40 bg-background/10 px-2 py-0.5 rounded-full">Hardcoded</span>
                            </div>
                            <div className="text-2xl font-bold text-background mb-1">14,278</div>
                            <div className="text-xs text-background/50 mb-3">Total visitors this month</div>
                            <div className="flex flex-col gap-1.5">
                                {visitors.map(({ country, count }) => (
                                    <div key={country} className="flex items-center justify-between text-xs">
                                        <span className="text-background/70">{country}</span>
                                        <span className="font-medium text-background">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Nav Link Columns */}
                    {Object.entries(links).map(([section, items]) => (
                        <div key={section}>
                            <h3 className="text-sm font-semibold text-background mb-4 uppercase tracking-wider">{section}</h3>
                            <ul className="flex flex-col gap-2.5">
                                {items.map((item) => (
                                    <li key={item}>
                                        <a href="#" className="text-sm text-background/60 hover:text-background transition-colors">
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-background/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-background/40">
                        © 2026 CodeCode. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        {[Github, Twitter, Linkedin, Globe].map((Icon, i) => (
                            <a
                                key={i}
                                href="#"
                                className="w-8 h-8 rounded-lg bg-background/10 flex items-center justify-center text-background/60 hover:bg-background/20 hover:text-background transition-colors"
                            >
                                <Icon className="w-4 h-4" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

// ─── Home2 (Main Page) ────────────────────────────────────────────────────────
const Home2 = () => {
    const { user, login, logout } = useMockAuth();

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1">
                <HeroHeader user={user} onLogin={login} />
                <FeaturesSection />
                <ContestsSection />
                <DesignContestSection />
            </main>
        </div>
    );
};

export default Home2;
