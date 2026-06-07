import {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import {Loader2, TrendingUp, Trophy, User as UserIcon} from 'lucide-react';
import api from '@/lib/axios';
import {getRankDetails} from '@/constants/ratings';

export default function ProfileHoverCard({user}) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!user?.id) return;

        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/users/${user.id}`);
                setProfile(res.data.data);
            } catch (err) {
                console.error('Failed to load profile', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user?.id]);

    // Format display name
    const displayName = user.name ?? user.username;

    // We get the color based on the actual fetched profile rating if available, else standard color
    const rank = getRankDetails(profile?.rating);

    return (
        <HoverCard
            open={open}
            onOpenChange={setOpen}
            openDelay={200}
            closeDelay={100}
        >
            <HoverCardTrigger asChild>
                <Link
                    to={`/user-profile/${user.username}`}
                    className={`font-medium transition-colors hover:underline underline-offset-4 ${profile ? rank.colorClass : 'text-foreground'}`}
                >
                    {displayName}
                </Link>
            </HoverCardTrigger>

            <HoverCardContent className="w-80 p-0 overflow-hidden" align="end">
                {loading || !profile ? (
                    <div className="flex justify-center items-center h-32 bg-card">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <div className="p-4 border-b border-border bg-muted/20">
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <UserIcon className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <h4
                                        className={`text-lg font-bold leading-none mb-1 ${rank.colorClass}`}
                                    >
                                        {profile.name}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground font-medium">
                                        <span>@{profile.username}</span>
                                        <span
                                            className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border shrink-0 ${
                                                profile.isOnline
                                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                    : 'bg-muted text-muted-foreground/80 border-border'
                                            }`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    profile.isOnline
                                                        ? 'bg-emerald-500 animate-pulse'
                                                        : 'bg-muted-foreground/40'
                                                }`}
                                            ></span>
                                            {profile.isOnline
                                                ? 'online'
                                                : 'offline'}
                                        </span>
                                    </div>
                                    <span
                                        className={`text-xs font-semibold uppercase tracking-wider mt-1.5 ${rank.colorClass}`}
                                    >
                                        {rank.title}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 divide-x divide-border bg-card p-4">
                            <div className="flex flex-col items-center justify-center space-y-1">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                    Rating
                                </span>
                                <div className="flex items-center gap-1.5 text-lg font-bold">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    {profile.rating || 0}
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center space-y-1">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                    Max Rating
                                </span>
                                <div className="flex items-center gap-1.5 text-lg font-bold">
                                    <Trophy className="w-4 h-4 text-amber-500" />
                                    {profile.max_rating || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </HoverCardContent>
        </HoverCard>
    );
}
