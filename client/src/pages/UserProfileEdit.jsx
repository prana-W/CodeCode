import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {toast} from 'sonner';
import {
    User as UserIcon,
    Mail,
    Building2,
    Loader2,
    Save,
    AtSign,
    ArrowLeft,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Card, CardContent, CardFooter} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectSeparator,
} from '@/components/ui/select';
import api from '@/lib/axios';
import {useAuth} from '@/context/AuthContext';
import {getRankDetails} from '@/constants/ratings';
import {INSTITUTES} from '@/constants/institutes';

export default function UserProfileEdit() {
    const {user, setUser} = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const [form, setForm] = useState({
        name: '',
        email: '',
        institute: '',
        customInstitute: '',
    });

    const [showCustomInstitute, setShowCustomInstitute] = useState(false);

    const topInstitutes = INSTITUTES.filter((i) => i !== 'Other');

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;
            setLoading(true);
            try {
                const res = await api.get(`/users/${user.id}`);
                const data = res.data.data;
                setProfile(data);

                const isPredefined = topInstitutes.includes(
                    data.institute || ''
                );
                const hasInstitute = !!data.institute;

                setForm({
                    name: data.name || '',
                    email: data.email || '',
                    institute: hasInstitute
                        ? isPredefined
                            ? data.institute
                            : 'Other'
                        : '',
                    customInstitute:
                        hasInstitute && !isPredefined ? data.institute : '',
                });
                setShowCustomInstitute(hasInstitute && !isPredefined);
            } catch (err) {
                toast.error(
                    err?.response?.data?.message ||
                        'Failed to load profile details.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user?.id]);

    const handleChange = (e) => {
        setForm((prev) => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleInstituteChange = (value) => {
        setForm((prev) => ({
            ...prev,
            institute: value,
            customInstitute: value === 'Other' ? prev.customInstitute : '',
        }));
        setShowCustomInstitute(value === 'Other');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name.trim() || !form.email.trim()) {
            toast.error('Name and email cannot be empty.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            toast.error('Please enter a valid email address.');
            return;
        }

        let finalInstitute = '';
        if (form.institute === 'Other') {
            finalInstitute = form.customInstitute.trim();
        } else if (form.institute) {
            finalInstitute = form.institute;
        }

        setUpdating(true);
        try {
            const res = await api.patch(`/users/${user.id}`, {
                name: form.name.trim(),
                email: form.email.trim(),
                institute: finalInstitute || null,
            });

            const updatedProfile = res.data.data;

            const updatedUserData = {...user, ...updatedProfile};
            setUser(updatedUserData);

            toast.success('Profile updated successfully!');
            navigate(`/user-profile/${user.username}`);
        } catch (err) {
            toast.error(
                err?.response?.data?.message || 'Failed to update profile.'
            );
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                        Loading profile details...
                    </p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-muted-foreground">
                    User profile could not be found.
                </p>
            </div>
        );
    }

    const rank = getRankDetails(profile.rating);

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                            <UserIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-serif font-bold tracking-tight text-foreground">
                                Edit Profile
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Make changes to your account details
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        onClick={() =>
                            navigate(`/user-profile/${user.username}`)
                        }
                        className="gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Profile
                    </Button>
                </div>

                <Card className="border-border overflow-hidden">
                    <div className="bg-muted/30 p-6 border-b border-border flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <UserIcon className="w-10 h-10 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                                <h2 className="text-xl font-bold text-foreground">
                                    {profile.name}
                                </h2>
                                <span
                                    className={`inline-flex items-center self-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-background border border-border ${rank.colorClass}`}
                                >
                                    {rank.title}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1 font-medium">
                                <AtSign className="w-4 h-4 text-muted-foreground/60" />
                                {profile.username}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="profile-username"
                                            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                        >
                                            Username
                                        </Label>
                                        <div className="relative">
                                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
                                            <Input
                                                id="profile-username"
                                                type="text"
                                                value={profile.username}
                                                disabled
                                                className="pl-10 bg-muted/50 border-border cursor-not-allowed text-muted-foreground"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="profile-name"
                                            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                        >
                                            Full Name{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                            <Input
                                                id="profile-name"
                                                name="name"
                                                type="text"
                                                value={form.name}
                                                onChange={handleChange}
                                                className="pl-10 border-border bg-card"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="profile-email"
                                            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                        >
                                            Email Address{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                            <Input
                                                id="profile-email"
                                                name="email"
                                                type="email"
                                                value={form.email}
                                                onChange={handleChange}
                                                className="pl-10 border-border bg-card"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="profile-institute"
                                            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                        >
                                            Institute
                                        </Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                                            <Select
                                                onValueChange={
                                                    handleInstituteChange
                                                }
                                                value={form.institute}
                                            >
                                                <SelectTrigger
                                                    id="profile-institute"
                                                    className="pl-10 border-border bg-card"
                                                >
                                                    <SelectValue placeholder="Select your institute" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {topInstitutes.map(
                                                        (inst) => (
                                                            <SelectItem
                                                                key={inst}
                                                                value={inst}
                                                            >
                                                                {inst}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                    <SelectSeparator />
                                                    <SelectItem value="Other">
                                                        Other / Custom
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {showCustomInstitute && (
                                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <Label
                                                htmlFor="profile-custom-institute"
                                                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                            >
                                                Custom Institute Name
                                            </Label>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                <Input
                                                    id="profile-custom-institute"
                                                    name="customInstitute"
                                                    type="text"
                                                    placeholder="Enter custom university/college name"
                                                    value={form.customInstitute}
                                                    onChange={handleChange}
                                                    className="pl-10 border-border bg-card"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-end gap-2 border-t border-border p-4 bg-muted/5">
                            <Button
                                type="button"
                                variant="outline"
                                className="text-xs font-semibold uppercase tracking-wider px-6"
                                onClick={() =>
                                    navigate(`/user-profile/${user.username}`)
                                }
                                disabled={updating}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="gap-2 text-xs font-semibold uppercase tracking-wider px-6"
                                disabled={updating}
                            >
                                {updating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Update Profile
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
