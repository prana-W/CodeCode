import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {toast} from 'sonner';
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    User,
    AtSign,
    Building2,
    Code2,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectSeparator,
} from '@/components/ui/select';
import AuthBrand from '@/components/auth/AuthBrand';
import {useAuth} from '@/context/AuthContext';
import {INSTITUTES} from '@/constants/institutes';

function getPasswordStrength(password) {
    if (!password) return { score: 0, label: '', color: 'bg-muted', textColor: 'text-muted-foreground' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const finalScore = Math.min(score, 4);
    
    const strengthMap = [
        { label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-500' },
        { label: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-500' },
        { label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
        { label: 'Strong', color: 'bg-blue-500', textColor: 'text-blue-500' },
        { label: 'Very Strong', color: 'bg-emerald-500', textColor: 'text-emerald-500' },
    ];
    return { ...strengthMap[finalScore], score: finalScore };
}

export default function Register() {
    const navigate = useNavigate();
    const {register} = useAuth();

    const [form, setForm] = useState({
        username: '',
        name: '',
        email: '',
        institute: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleInstituteChange = (value) => {
        setForm((prev) => ({...prev, institute: value}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const {username, name, email, password, confirmPassword, institute} =
            form;

        if (!username || !name || !email || !password) {
            toast.error('Please fill in all required fields.');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters.');
            return;
        }

        const payload = {username, name, email, password};
        if (institute) payload.institute = institute;

        setLoading(true);
        try {
            await register(payload);
            toast.success('Account created! Please sign in.');
            navigate('/login');
        } catch (err) {
            const message =
                err?.response?.data?.message ||
                'Registration failed. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const topInstitutes = INSTITUTES.filter((i) => i !== 'Other');
    const otherOption = 'Other';
    const strength = getPasswordStrength(form.password);

    return (
        <div className="min-h-screen flex bg-background">
            <AuthBrand />

            <div className="flex-1 flex items-start justify-center px-8 py-12 overflow-y-auto">
                <div className="w-full max-w-md space-y-8">
                    <div className="flex items-center gap-2 lg:hidden">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                            <Code2 className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-foreground">
                            CodeCode
                        </span>
                    </div>

                    <div className="space-y-1.5">
                        <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">
                            Create your account
                        </h1>
                        <p className="text-muted-foreground">
                            Start competing in minutes — it&apos;s free
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                        noValidate
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="reg-username">
                                    Username{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        id="reg-username"
                                        name="username"
                                        type="text"
                                        autoComplete="username"
                                        placeholder="coder_x"
                                        value={form.username}
                                        onChange={handleChange}
                                        className="pl-10 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reg-name">
                                    Full name{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        id="reg-name"
                                        name="name"
                                        type="text"
                                        autoComplete="name"
                                        placeholder="Alex Mercer"
                                        value={form.name}
                                        onChange={handleChange}
                                        className="pl-10 shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reg-email">
                                Email address{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="reg-email"
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
                            <Label htmlFor="reg-institute">
                                Institute{' '}
                                <span className="text-muted-foreground font-normal text-xs">
                                    (optional)
                                </span>
                            </Label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                                <Select
                                    onValueChange={handleInstituteChange}
                                    value={form.institute}
                                >
                                    <SelectTrigger
                                        id="reg-institute"
                                        className="pl-10 shadow-sm"
                                    >
                                        <SelectValue placeholder="Select your institute" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {topInstitutes.map((inst) => (
                                            <SelectItem key={inst} value={inst}>
                                                {inst}
                                            </SelectItem>
                                        ))}
                                        <SelectSeparator />
                                        <SelectItem value={otherOption}>
                                            {otherOption}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reg-password">
                                Password{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="reg-password"
                                    name="password"
                                    type={
                                        showPassword ? 'text' : 'password'
                                    }
                                    autoComplete="new-password"
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
                                    onClick={() =>
                                        setShowPassword((v) => !v)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            {form.password && (
                                <div className="space-y-1.5 pt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-wider">
                                        <span className="text-muted-foreground">Strength</span>
                                        <span className={strength.textColor}>{strength.label}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex gap-0.5">
                                        {Array.from({length: 5}).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-full flex-1 transition-all duration-300 ${
                                                    i <= strength.score ? strength.color : 'bg-muted/40'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reg-confirm-password">
                                Confirm Password{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="reg-confirm-password"
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
                        </div>

                        <p className="text-[10px] text-muted-foreground">
                            Minimum 8 characters required.
                        </p>

                        <Button
                            id="register-submit"
                            type="submit"
                            className="w-full text-xs font-semibold uppercase tracking-wider py-5 shadow-sm"
                            disabled={loading}
                        >
                            {loading ? 'Creating account…' : 'Create Account'}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-3 bg-background text-muted-foreground">
                                Already have an account?
                            </span>
                        </div>
                    </div>

                    <p className="text-center text-sm text-muted-foreground">
                        Already a member?{' '}
                        <Link
                            to="/login"
                            className="font-semibold text-foreground hover:underline underline-offset-4"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
