import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Code2, Menu, X, LogOut, PenSquare, Trophy, Home, Info, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import ProfileHoverCard from './ProfileHoverCard';

export default function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Logged out successfully.');
            navigate('/login');
        } catch {
            toast.error('Failed to log out.');
        }
    };

    const navClass = ({ isActive }) =>
        [
            'flex items-center gap-1.5 text-sm font-medium transition-colors px-1',
            isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
        ].join(' ');

    // Dynamic Navigation Links based on role
    const getNavLinks = () => {
        if (!user) return [];
        
        if (user.role === 'admin') {
            return [
                { to: '/verify-contests', label: 'Verify Contests', Icon: ShieldCheck },
                { to: '/contests', label: 'Contests', Icon: Trophy },
                { to: '/about', label: 'About Us', Icon: Info },
            ];
        }
        
        return [
            { to: '/', label: 'Home', Icon: Home, end: true },
            { to: '/contests', label: 'Contests', Icon: Trophy },
            { to: '/design-contest', label: 'Design Contest', Icon: PenSquare },
            { to: '/about', label: 'About Us', Icon: Info },
        ];
    };

    const navLinks = getNavLinks();

    return (
        <header className="w-full border-b border-border bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary">
                        <Code2 className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-base tracking-tight text-foreground">
                        CodeCode
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {navLinks.map(({ to, label, Icon, end }) => (
                        <NavLink key={to} to={to} end={end} className={navClass}>
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Desktop Auth */}
                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <>
                            <ProfileHoverCard user={user} />
                            <Button
                                id="header-logout"
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="gap-1.5 text-muted-foreground hover:text-foreground"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button id="header-login" variant="ghost" size="sm" asChild>
                                <Link to="/login">Sign In</Link>
                            </Button>
                            <Button id="header-register" size="sm" asChild>
                                <Link to="/register">Register</Link>
                            </Button>
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
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
                    {navLinks.map(({ to, label, Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={navClass}
                            onClick={() => setMobileOpen(false)}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </NavLink>
                    ))}

                    <div className="pt-3 border-t border-border space-y-2">
                        {user ? (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    Signed in as{' '}
                                    <ProfileHoverCard user={user} />
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-1.5"
                                    onClick={() => { handleLogout(); setMobileOpen(false); }}
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1" asChild>
                                    <Link to="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
                                </Button>
                                <Button size="sm" className="flex-1" asChild>
                                    <Link to="/register" onClick={() => setMobileOpen(false)}>Register</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
