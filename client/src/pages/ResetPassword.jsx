import {useState, useEffect} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {toast} from 'sonner';
import {
    Eye,
    EyeOff,
    Lock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowLeft,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import AuthBrand from '@/components/auth/AuthBrand';
import api from '@/lib/axios';

// ── Password strength — same logic as Register.jsx ──────────────────────────
function getPasswordStrength(password) {
    if (!password)
        return {
            score: 0,
            label: '',
            color: 'bg-muted',
            textColor: 'text-muted-foreground',
        };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const finalScore = Math.min(score, 4);
    const strengthMap = [
        {label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-500'},
        {label: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-500'},
        {
            label: 'Medium',
            color: 'bg-yellow-500',
            textColor: 'text-yellow-500',
        },
        {label: 'Strong', color: 'bg-blue-500', textColor: 'text-blue-500'},
        {
            label: 'Very Strong',
            color: 'bg-emerald-500',
            textColor: 'text-emerald-500',
        },
    ];
    return {...strengthMap[finalScore], score: finalScore};
}

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const userId = searchParams.get('userid');
    const token = searchParams.get('token');

    const [form, setForm] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [countdown, setCountdown] = useState(5);

    const strength = getPasswordStrength(form.newPassword);

    // ── Countdown + redirect after success ───────────────────────────────────
    useEffect(() => {
        if (!success) return;
        if (countdown === 0) {
            navigate('/login');
            return;
        }
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [success, countdown, navigate]);

    // ── Validate URL params ───────────────────────────────────────────────────
    const isValidLink = Boolean(userId && token);

    const handleChange = (e) => {
        setForm((prev) => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.newPassword || !form.confirmPassword) {
            toast.error('Please fill in both password fields.');
            return;
        }

        if (form.newPassword !== form.confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }

        if (form.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password', {
                userId,
                token,
                newPassword: form.newPassword,
            });
            setSuccess(true);
        } catch (err) {
            const message =
                err?.response?.data?.message ||
                'Something went wrong. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    // ── Invalid / missing params ──────────────────────────────────────────────
    if (!isValidLink) {
        return (
            <div className="min-h-screen flex bg-background">
                <AuthBrand />
                <div className="flex-1 flex items-center justify-center px-8 py-12">
                    <div className="w-full max-w-md space-y-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                            <AlertCircle className="w-8 h-8 text-destructive" />
                        </div>
                        <div className="space-y-1.5">
                            <h1 className="text-2xl font-serif font-bold tracking-tight text-foreground">
                                Invalid reset link
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                This password reset link is missing required
                                information. Please request a new one.
                            </p>
                        </div>
                        <Link
                            to="/forgot-password"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:underline underline-offset-4"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Request a new reset link
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Success state ─────────────────────────────────────────────────────────
    if (success) {
        return (
            <div className="min-h-screen flex bg-background">
                <AuthBrand />
                <div className="flex-1 flex items-center justify-center px-8 py-12">
                    <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div className="space-y-1.5">
                                <h1 className="text-2xl font-serif font-bold tracking-tight text-foreground">
                                    Password updated!
                                </h1>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Your password has been reset successfully.
                                    You can now log in with your new password.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                Redirecting to login in{' '}
                                <span className="font-bold text-foreground tabular-nums">
                                    {countdown}s
                                </span>
                                …
                            </p>
                        </div>

                        <Button
                            onClick={() => navigate('/login')}
                            className="w-full text-xs font-semibold uppercase tracking-wider py-5"
                        >
                            Go to Login Now
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Reset form ────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex bg-background">
            <AuthBrand />

            <div className="flex-1 flex items-center justify-center px-8 py-12">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile logo */}
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
                            Set new password
                        </h1>
                        <p className="text-muted-foreground">
                            Choose a strong password to secure your account.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                        noValidate
                    >
                        {/* New Password */}
                        <div className="space-y-2">
                            <Label htmlFor="reset-new-password">
                                New Password{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="reset-new-password"
                                    name="newPassword"
                                    type={showNewPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    value={form.newPassword}
                                    onChange={handleChange}
                                    className="pl-10 pr-10 shadow-sm"
                                />
                                <button
                                    type="button"
                                    aria-label={
                                        showNewPassword
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                    onClick={() =>
                                        setShowNewPassword((v) => !v)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            {/* Password strength bar */}
                            {form.newPassword && (
                                <div className="space-y-1.5 pt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-wider">
                                        <span className="text-muted-foreground">
                                            Strength
                                        </span>
                                        <span className={strength.textColor}>
                                            {strength.label}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex gap-0.5">
                                        {Array.from({length: 5}).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-full flex-1 transition-all duration-300 ${
                                                    i <= strength.score
                                                        ? strength.color
                                                        : 'bg-muted/40'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="reset-confirm-password">
                                Confirm Password{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="reset-confirm-password"
                                    name="confirmPassword"
                                    type={
                                        showConfirmPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    className="pl-10 pr-10 shadow-sm"
                                />
                                <button
                                    type="button"
                                    aria-label={
                                        showConfirmPassword
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                    onClick={() =>
                                        setShowConfirmPassword((v) => !v)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            {/* Match indicator */}
                            {form.confirmPassword && (
                                <p
                                    className={`text-[10px] font-semibold transition-colors duration-200 ${
                                        form.newPassword ===
                                        form.confirmPassword
                                            ? 'text-emerald-500'
                                            : 'text-destructive'
                                    }`}
                                >
                                    {form.newPassword === form.confirmPassword
                                        ? '✓ Passwords match'
                                        : '✗ Passwords do not match'}
                                </p>
                            )}
                        </div>

                        <p className="text-[10px] text-muted-foreground">
                            Minimum 8 characters required.
                        </p>

                        <Button
                            id="reset-password-submit"
                            type="submit"
                            className="w-full text-xs font-semibold uppercase tracking-wider py-5 shadow-sm"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Resetting password…
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        <Link
                            to="/forgot-password"
                            className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:underline underline-offset-4"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Request a new link
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
