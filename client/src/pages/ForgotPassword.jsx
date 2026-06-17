import {useState} from 'react';
import {Link} from 'react-router-dom';
import {toast} from 'sonner';
import {Mail, ArrowLeft, CheckCircle2, Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import AuthBrand from '@/components/auth/AuthBrand';
import api from '@/lib/axios';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error('Please enter your email address.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/forgot-password', {email: email.trim()});
            setSent(true);
        } catch (err) {
            const message =
                err?.response?.data?.message ||
                'Something went wrong. Please try again.';
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

                    {!sent ? (
                        <>
                            <div className="space-y-1.5">
                                <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">
                                    Forgot password?
                                </h1>
                                <p className="text-muted-foreground">
                                    Enter your registered email and we&apos;ll
                                    send you a reset link.
                                </p>
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="space-y-5"
                                noValidate
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="forgot-email">
                                        Email address
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                        <Input
                                            id="forgot-email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                            className="pl-10 shadow-sm"
                                        />
                                    </div>
                                </div>

                                <Button
                                    id="forgot-password-submit"
                                    type="submit"
                                    className="w-full text-xs font-semibold uppercase tracking-wider py-5 shadow-sm"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Sending link…
                                        </>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </Button>
                            </form>

                            <p className="text-center text-sm text-muted-foreground">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:underline underline-offset-4"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    Back to login
                                </Link>
                            </p>
                        </>
                    ) : (
                        /* Success state */
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                </div>
                                <div className="space-y-1.5">
                                    <h1 className="text-2xl font-serif font-bold tracking-tight text-foreground">
                                        Check your inbox
                                    </h1>
                                    <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                                        If{' '}
                                        <span className="font-semibold text-foreground">
                                            {email}
                                        </span>{' '}
                                        is registered, a password reset link has
                                        been sent. The link expires in{' '}
                                        <strong>5 minutes</strong>.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1.5">
                                <p className="font-medium text-foreground">
                                    Didn&apos;t receive it?
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                    <li>Check your spam or junk folder.</li>
                                    <li>
                                        Make sure you used the email linked to
                                        your account.
                                    </li>
                                    <li>
                                        Wait a few minutes, then{' '}
                                        <button
                                            onClick={() => setSent(false)}
                                            className="font-semibold text-foreground hover:underline underline-offset-2"
                                        >
                                            try again
                                        </button>
                                        .
                                    </li>
                                </ul>
                            </div>

                            <p className="text-center text-sm text-muted-foreground">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:underline underline-offset-4"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    Back to login
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
