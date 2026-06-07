import {useState, useEffect} from 'react';
import api from '@/lib/axios';
import {Link, NavLink, useNavigate} from 'react-router-dom';
import {Code2, Menu, X, LogOut} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/context/AuthContext';
import {toast} from 'sonner';
import ProfileHoverCard from './ProfileHoverCard';

export default function Header() {
    const {user, logout} = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [onlineCount, setOnlineCount] = useState(null);

    useEffect(() => {
        if (!user) {
            setOnlineCount(null);
            return;
        }

        const sendHeartbeat = async () => {
            try {
                const response = await api.post('/users/heartbeat');
                if (response.data && response.data.data) {
                    setOnlineCount(response.data.data.onlineUsers);
                }
            } catch (error) {
                console.error('Error sending heartbeat:', error);
            }
        };

        // Send heartbeat immediately on mount/login
        sendHeartbeat();

        // Send heartbeat every 30 seconds
        const interval = setInterval(sendHeartbeat, 30000);

        return () => clearInterval(interval);
    }, [user]);

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Logged out successfully.');
            navigate('/login');
        } catch {
            toast.error('Failed to log out.');
        }
    };

    const getNavLinks = () => {
        if (!user) return [];

        if (user.role === 'admin') {
            return [
                {to: '', label: 'HOME'},
                {to: '/contests', label: 'CONTESTS'},
                {to: '/admin/verify-contests', label: 'VERIFY CONTESTS'},
                {to: '/rankings', label: 'RANKINGS'},
                {to: '/about', label: 'ABOUT'},
            ];
        }

        return [
            {to: '/', label: 'HOME', end: true},
            {to: '/contests', label: 'CONTESTS'},
            {to: '/design-contest', label: 'DESIGN'},
            {to: '/rankings', label: 'RANKINGS'},
            {to: '/about', label: 'ABOUT'},
        ];
    };

    const navLinks = getNavLinks();

    return (
        <header className="w-full bg-background flex flex-col mb-4">
            {/* Top Row: Branding & Auth */}
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 flex items-center justify-between h-16">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
                        <Code2 className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-foreground uppercase">
                        CodeCode
                    </span>
                </Link>

                {/* Desktop Auth */}
                <div className="hidden md:flex items-center text-sm font-semibold tracking-wide">
                    {user ? (
                        <>
                            <ProfileHoverCard user={user} />
                            <span className="mx-2 text-muted-foreground/60 font-normal">
                                |
                            </span>
                            <button
                                onClick={handleLogout}
                                className="text-primary hover:underline underline-offset-4 transition-colors"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/register"
                                className="text-primary hover:underline underline-offset-4 transition-colors"
                            >
                                Register
                            </Link>
                            <span className="mx-2 text-muted-foreground/60 font-normal">
                                |
                            </span>
                            <Link
                                to="/login"
                                className="text-primary hover:underline underline-offset-4 transition-colors"
                            >
                                Sign In
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile hamburger */}
                <button
                    id="header-mobile-toggle"
                    className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    onClick={() => setMobileOpen((v) => !v)}
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? (
                        <X className="w-5 h-5" />
                    ) : (
                        <Menu className="w-5 h-5" />
                    )}
                </button>
            </div>

            {/* Bottom Row: Navigation Bar (Only for logged-in users) */}
            {user && (
                <div className="hidden md:block max-w-7xl mx-auto w-full px-4 sm:px-6 pb-2">
                    <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-border bg-card px-6 shadow-sm overflow-hidden">
                        {navLinks.map(({to, label, end}) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                className={({isActive}) =>
                                    `text-xs font-bold tracking-wider py-3 border-b-[3px] transition-all whitespace-nowrap ${
                                        isActive
                                            ? 'border-primary text-foreground'
                                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                    }`
                                }
                            >
                                {label}
                            </NavLink>
                        ))}

                        {/* Right-aligned Online Users counter */}
                        {onlineCount !== null && (
                            <div className="ml-auto flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-muted-foreground py-3 whitespace-nowrap">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span>online users: {onlineCount}</span>
                            </div>
                        )}
                    </nav>
                </div>
            )}

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
                    {user &&
                        navLinks.map(({to, label, end}) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                className={({isActive}) =>
                                    `block py-2 text-sm font-bold tracking-wide transition-colors ${
                                        isActive
                                            ? 'text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`
                                }
                                onClick={() => setMobileOpen(false)}
                            >
                                {label}
                            </NavLink>
                        ))}

                    <div className="pt-3 border-t border-border space-y-2">
                        {user ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        Signed in as{' '}
                                        <ProfileHoverCard user={user} />
                                    </p>
                                    {onlineCount !== null && (
                                        <div className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                                            <span className="relative flex h-1.5 w-1.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                            </span>
                                            <span>online users: {onlineCount}</span>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-1.5"
                                    onClick={() => {
                                        handleLogout();
                                        setMobileOpen(false);
                                    }}
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    asChild
                                >
                                    <Link
                                        to="/login"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        Sign In
                                    </Link>
                                </Button>
                                <Button size="sm" className="flex-1" asChild>
                                    <Link
                                        to="/register"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        Register
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
