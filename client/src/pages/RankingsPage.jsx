import {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {toast} from 'sonner';
import {
    Loader2,
    TrendingUp,
    Trophy,
    Building2,
    User as UserIcon,
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/components/ui/card';
import api from '@/lib/axios';
import {getRankDetails} from '@/constants/ratings';
import {INSTITUTES} from '@/constants/institutes';
import {useAuth} from '@/context/AuthContext';

export default function RankingsPage() {
    const {user} = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('rating');
    const [institute, setInstitute] = useState('All Institutes');

    const fetchRankings = async () => {
        setLoading(true);
        try {
            const params = {sortBy};
            if (institute !== 'All Institutes') {
                params.institute = institute;
            }
            const res = await api.get('/users/rankings', {params});
            setUsers(res.data.data);
        } catch (err) {
            toast.error(
                err?.response?.data?.message || 'Failed to fetch rankings'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRankings();
    }, [sortBy, institute]);

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                            <Trophy className="w-8 h-8 text-amber-500" />
                            Global Rankings
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm font-medium">
                            Compete and climb the CodeCode leaderboard
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-muted/30 p-2 rounded-lg border border-border">
                        {/* Sort By Dropdown */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-full sm:w-[160px] bg-card border-border">
                                    <SelectValue placeholder="Sort By" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rating">
                                        Current Rating
                                    </SelectItem>
                                    <SelectItem value="max_rating">
                                        Max Rating
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Institute Filter */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <Select
                                value={institute}
                                onValueChange={setInstitute}
                            >
                                <SelectTrigger className="w-full sm:w-[220px] bg-card border-border">
                                    <SelectValue placeholder="Filter Institute" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All Institutes">
                                        All Institutes
                                    </SelectItem>
                                    {INSTITUTES.map((inst) => (
                                        <SelectItem key={inst} value={inst}>
                                            {inst}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Rankings Table Card */}
                <Card className="border-border shadow-sm overflow-hidden bg-card">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50 border-b border-border">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-16 text-center font-bold text-muted-foreground uppercase text-xs tracking-wider">
                                            #
                                        </TableHead>
                                        <TableHead className="font-bold text-muted-foreground uppercase text-xs tracking-wider">
                                            User
                                        </TableHead>
                                        <TableHead className="font-bold text-muted-foreground uppercase text-xs tracking-wider">
                                            Title
                                        </TableHead>
                                        <TableHead className="text-right font-bold text-muted-foreground uppercase text-xs tracking-wider">
                                            Rating
                                        </TableHead>
                                        <TableHead className="text-right font-bold text-muted-foreground uppercase text-xs tracking-wider hidden sm:table-cell">
                                            Max Rating
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="h-48 text-center"
                                            >
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                                    <p className="text-sm text-muted-foreground">
                                                        Loading rankings...
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : users.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="h-48 text-center"
                                            >
                                                <p className="text-muted-foreground font-medium">
                                                    No users found matching the
                                                    criteria.
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((u, idx) => {
                                            const rank = getRankDetails(
                                                u.rating
                                            );
                                            const isCurrentUser =
                                                user?.username === u.username;

                                            return (
                                                <TableRow
                                                    key={u.id}
                                                    className={`transition-colors ${isCurrentUser ? 'bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-muted/30'}`}
                                                >
                                                    <TableCell className="text-center font-bold text-muted-foreground">
                                                        {idx + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="hidden sm:flex w-8 h-8 rounded-full bg-primary/10 items-center justify-center shrink-0">
                                                                <UserIcon className="w-4 h-4 text-primary" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <Link
                                                                    to={`/user-profile/${u.username}`}
                                                                    className={`font-bold text-sm hover:underline underline-offset-4 ${rank.colorClass}`}
                                                                >
                                                                    {u.username}
                                                                </Link>
                                                                {u.name && (
                                                                    <span className="text-xs text-muted-foreground/80">
                                                                        {u.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex items-center text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-background border border-border ${rank.colorClass}`}
                                                        >
                                                            {rank.title}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span
                                                            className={`font-extrabold text-sm sm:text-base ${rank.colorClass}`}
                                                        >
                                                            {u.rating || 0}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right hidden sm:table-cell">
                                                        <span className="font-bold text-sm text-foreground">
                                                            {u.max_rating || 0}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
