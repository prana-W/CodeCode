import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Loader2, TrendingUp, Trophy, User as UserIcon } from 'lucide-react';
import api from '@/lib/axios';

const getRankDetails = (rating) => {
    if (!rating) return { title: 'Unrated', color: 'text-gray-500' };
    if (rating < 1200) return { title: 'Newbie', color: 'text-gray-500' };
    if (rating < 1400) return { title: 'Pupil', color: 'text-green-500' };
    if (rating < 1600) return { title: 'Specialist', color: 'text-cyan-500' };
    if (rating < 1900) return { title: 'Expert', color: 'text-blue-500' };
    if (rating < 2100) return { title: 'Candidate Master', color: 'text-purple-500' };
    if (rating < 2300) return { title: 'Master', color: 'text-orange-400' };
    if (rating < 2400) return { title: 'International Master', color: 'text-orange-500' };
    if (rating < 2600) return { title: 'Grandmaster', color: 'text-red-500' };
    if (rating < 3000) return { title: 'International Grandmaster', color: 'text-red-600' };
    return { title: 'Legendary Grandmaster', color: 'text-red-700 font-bold' };
};

export default function ProfileHoverCard({ user }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open && !profile) {
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
        }
    }, [open, profile, user.id]);

    // Format display name
    const displayName = user.name ?? user.username;
    
    // We get the color based on the actual fetched profile rating if available, else standard color
    const rank = getRankDetails(profile?.rating);

    return (
        <HoverCard open={open} onOpenChange={setOpen} openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
                <Link 
                    to="/user-profile" 
                    className={`font-medium transition-colors hover:underline underline-offset-4 ${profile ? rank.color : 'text-foreground'}`}
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
                                    <h4 className={`text-lg font-bold leading-none mb-1 ${rank.color}`}>
                                        {profile.name}
                                    </h4>
                                    <span className="text-sm text-muted-foreground font-medium">@{profile.username}</span>
                                    <span className={`text-xs font-semibold uppercase tracking-wider mt-1.5 ${rank.color}`}>
                                        {rank.title}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 divide-x divide-border bg-card p-4">
                            <div className="flex flex-col items-center justify-center space-y-1">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Rating</span>
                                <div className="flex items-center gap-1.5 text-lg font-bold">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    {profile.rating || 0}
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center space-y-1">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Max Rating</span>
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
