import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    User as UserIcon, Mail, Building2, TrendingUp, Trophy,
    Shield, Loader2, Edit3, AtSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
} from '@/components/ui/card';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { getRankDetails } from '@/constants/ratings';

export default function UserProfile() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;
            setLoading(true);
            try {
                const res = await api.get(`/users/${user.id}`);
                setProfile(res.data.data);
            } catch (err) {
                toast.error(err?.response?.data?.message || 'Failed to load profile details.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user?.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading profile details...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-muted-foreground">User profile could not be found.</p>
            </div>
        );
    }

    const rank = getRankDetails(profile.rating);

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                
                {/* Profile Title Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                        <UserIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            User Profile
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            View your account details and statistics
                        </p>
                    </div>
                </div>

                {/* Single Large Card */}
                <Card className="border-border overflow-hidden">
                    {/* Banner Top Profile Section */}
                    <div className="bg-muted/30 p-6 border-b border-border flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <UserIcon className="w-10 h-10 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                                <h2 className="text-xl font-bold text-foreground">
                                    {profile.name}
                                </h2>
                                <span className={`inline-flex items-center self-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-background border border-border ${rank.colorClass}`}>
                                    {rank.title}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1 font-medium">
                                <AtSign className="w-4 h-4 text-muted-foreground/60" />
                                {profile.username}
                            </p>
                        </div>
                    </div>

                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Column 1: Account Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80 mb-2 border-b border-border/40 pb-1">
                                Account Information
                            </h3>
                            
                            {/* Email */}
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground font-semibold">Email Address</span>
                                <span className="text-sm text-foreground flex items-center gap-2 font-medium">
                                    <Mail className="w-4 h-4 text-muted-foreground/50" />
                                    {profile.email}
                                </span>
                            </div>

                            {/* Institute */}
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground font-semibold">Academic Institute</span>
                                <span className="text-sm text-foreground flex items-center gap-2 font-medium">
                                    <Building2 className="w-4 h-4 text-muted-foreground/50" />
                                    {profile.institute || <span className="text-muted-foreground italic font-normal">Not specified</span>}
                                </span>
                            </div>

                            {/* Role */}
                            {profile.role === 'admin' && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground font-semibold">Role</span>
                                    <span className="text-sm text-foreground flex items-center gap-2 font-medium">
                                        <Shield className="w-4 h-4 text-muted-foreground/50" />
                                        <span className="capitalize">{profile.role}</span>
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Column 2: Rating Statistics */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80 mb-2 border-b border-border/40 pb-1">
                                Rating & Stats
                            </h3>

                            {/* Current Rating */}
                            <div className="flex items-center justify-between border border-border/40 p-3.5 rounded-lg bg-muted/10">
                                <span className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    Current Rating
                                </span>
                                <span className={`font-extrabold text-2xl ${rank.colorClass}`}>
                                    {profile.rating || 0}
                                </span>
                            </div>

                            {/* Max Rating */}
                            <div className="flex items-center justify-between border border-border/40 p-3.5 rounded-lg bg-muted/10">
                                <span className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
                                    <Trophy className="w-4 h-4 text-amber-500" />
                                    Max Rating
                                </span>
                                <span className="font-extrabold text-2xl text-foreground">
                                    {profile.max_rating || 0}
                                </span>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-end border-t border-border p-4 bg-muted/5">
                        <Button
                            onClick={() => navigate('/user-profile/edit')}
                            className="gap-2"
                        >
                            <Edit3 className="w-4 h-4" />
                            Update Profile
                        </Button>
                    </CardFooter>
                </Card>

            </div>
        </div>
    );
}
