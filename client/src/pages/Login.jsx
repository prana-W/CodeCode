import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {toast} from 'sonner';
import {Eye, EyeOff, Mail, Lock} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import AuthBrand from '@/components/auth/AuthBrand';
import {useAuth} from '@/context/AuthContext';

export default function Login() {
    const navigate = useNavigate();
    const {login} = useAuth();
    const [form, setForm] = useState({email: '', password: ''});
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.email || !form.password) {
            toast.error('Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            await login(form.email, form.password);
            toast.success('Welcome back! Login successful.');
            navigate('/');
        } catch (err) {
            const message =
                err?.response?.data?.message ||
                'Login failed. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-background">
            <AuthBrand />

            <div className="flex-1 flex items-center justify-center px-8 py-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="flex items-center gap-2 lg:hidden">
                        <img
                            src="/favicon.svg"
                            alt="CodeCode"
                            className="w-8 h-8 object-contain"
                        />
                        <span className="text-lg font-bold tracking-tight text-foreground">
                            CodeCode
                        </span>
                    </div>

                    <div className="space-y-1.5">
                        <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">
                            Welcome back
                        </h1>
                        <p className="text-muted-foreground">
                            Sign in to continue your journey
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                        noValidate
                    >
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="login-email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    className="pl-10 shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="login-password">Password</Label>
                                <button
                                    type="button"
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="login-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={handleChange}
                                    className="pl-10 pr-10 shadow-sm"
                                />
                                <button
                                    type="button"
                                    aria-label={
                                        showPassword
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <Button
                            id="login-submit"
                            type="submit"
                            className="w-full text-xs font-semibold uppercase tracking-wider py-5 shadow-sm"
                            disabled={loading}
                        >
                            {loading ? 'Signing in…' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-3 bg-background text-muted-foreground">
                                New to CodeCode?
                            </span>
                        </div>
                    </div>

                    <p className="text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link
                            to="/register"
                            className="font-semibold text-foreground hover:underline underline-offset-4"
                        >
                            Create one for free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
