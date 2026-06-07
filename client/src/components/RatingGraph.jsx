import {useState, useMemo} from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Dot,
} from 'recharts';
import {TrendingUp, TrendingDown, Minus, Trophy} from 'lucide-react';
import {getRankDetails, RATING_TIERS} from '@/constants/ratings';

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function fmtShortDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
    });
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function RatingTooltip({active, payload}) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const rank = getRankDetails(d.final_rating);
    const delta = d.delta ?? 0;
    const isPositive = delta > 0;
    const isZero = delta === 0;

    return (
        <div className="bg-card border border-border rounded-xl shadow-xl p-4 min-w-[220px] text-sm">
            {/* Contest Title */}
            <p className="font-bold text-foreground leading-tight mb-2 pr-2 border-b border-border/50 pb-2">
                {d.contest_title}
            </p>

            {/* Date */}
            <p className="text-xs text-muted-foreground mb-3">
                {fmtDate(d.contest_end_time)}
            </p>

            {/* Rating row */}
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-muted-foreground">Rating</span>
                <span className={`font-extrabold text-base ${rank.colorClass}`}>
                    {d.final_rating}
                </span>
            </div>

            {/* Delta row */}
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-muted-foreground">Change</span>
                <span
                    className={`font-bold flex items-center gap-0.5 ${
                        isZero
                            ? 'text-muted-foreground'
                            : isPositive
                              ? 'text-emerald-500'
                              : 'text-red-500'
                    }`}
                >
                    {isZero ? (
                        <Minus className="w-3.5 h-3.5" />
                    ) : isPositive ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {isPositive ? '+' : ''}
                    {delta}
                </span>
            </div>

            {/* Rank row */}
            {d.final_rank != null && (
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-muted-foreground">Rank</span>
                    <span className="font-semibold text-foreground">
                        #{d.final_rank}
                    </span>
                </div>
            )}

            {/* Div badge */}
            <div className="flex items-center justify-between mt-1 pt-2 border-t border-border/40">
                <span className="text-muted-foreground">Division</span>
                <span className="text-xs font-bold text-muted-foreground">
                    Div. {d.division}
                </span>
            </div>
        </div>
    );
}

// ─── Custom Active Dot ───────────────────────────────────────────────────────

function ActiveContestDot(props) {
    const {cx, cy, payload} = props;
    const rank = getRankDetails(payload.final_rating);
    return (
        <circle
            cx={cx}
            cy={cy}
            r={6}
            fill={rank.hexColor}
            stroke="white"
            strokeWidth={2}
            style={{filter: `drop-shadow(0 0 4px ${rank.hexColor}88)`}}
        />
    );
}

function ContestDot(props) {
    const {cx, cy, payload} = props;
    const rank = getRankDetails(payload.final_rating);
    return (
        <circle
            cx={cx}
            cy={cy}
            r={4}
            fill={rank.hexColor}
            stroke="hsl(var(--background))"
            strokeWidth={1.5}
        />
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const RANGES = [
    {label: '1M', months: 1},
    {label: '6M', months: 6},
    {label: '1Y', months: 12},
    {label: 'All', months: null},
];

export default function RatingGraph({history, loading}) {
    const [range, setRange] = useState('All');

    const filtered = useMemo(() => {
        if (!history?.length) return [];
        const selected = RANGES.find((r) => r.label === range);
        if (!selected?.months) return history;
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - selected.months);
        return history.filter(
            (d) => new Date(d.contest_end_time) >= cutoff
        );
    }, [history, range]);

    // Compute gradient stops from rating tiers
    const gradientStops = useMemo(() => {
        if (!filtered.length) return [];
        const ratings = filtered.map((d) => d.final_rating);
        const minR = Math.min(...ratings) - 100;
        const maxR = Math.max(...ratings) + 100;
        const span = maxR - minR;

        return RATING_TIERS.slice()
            .reverse()
            .map((tier) => {
                const pct = Math.max(
                    0,
                    Math.min(1, (tier.max - minR) / span)
                );
                return {offset: `${(1 - pct) * 100}%`, color: tier.hexColor};
            });
    }, [filtered]);

    // Y-axis domain with a bit of padding
    const yDomain = useMemo(() => {
        if (!filtered.length) return ['auto', 'auto'];
        const vals = filtered.map((d) => d.final_rating);
        const mn = Math.min(...vals);
        const mx = Math.max(...vals);
        const pad = Math.max(100, Math.round((mx - mn) * 0.15));
        return [Math.max(0, mn - pad), mx + pad];
    }, [filtered]);

    if (loading) {
        return (
            <div className="rounded-xl border border-border bg-card/50 p-6">
                <div className="h-6 skeleton rounded w-48 mb-6" />
                <div className="h-64 skeleton rounded" />
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-foreground">
                            Rating History
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {filtered.length} rated contest
                            {filtered.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Range switcher */}
                <div className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-1">
                    {RANGES.map(({label}) => (
                        <button
                            key={label}
                            onClick={() => setRange(label)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
                                range === label
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Graph */}
            <div className="px-4 pt-4 pb-6">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Trophy className="w-10 h-10 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">
                            {history?.length
                                ? 'No contests in this time range.'
                                : 'No rated contests participated yet.'}
                        </p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart
                            data={filtered}
                            margin={{top: 10, right: 16, left: 0, bottom: 0}}
                        >
                            <defs>
                                <linearGradient
                                    id="ratingGradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    {gradientStops.map((s, i) => (
                                        <stop
                                            key={i}
                                            offset={s.offset}
                                            stopColor={s.color}
                                            stopOpacity={0.18}
                                        />
                                    ))}
                                </linearGradient>
                                <linearGradient
                                    id="lineGradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    {gradientStops.map((s, i) => (
                                        <stop
                                            key={i}
                                            offset={s.offset}
                                            stopColor={s.color}
                                            stopOpacity={1}
                                        />
                                    ))}
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="hsl(var(--border))"
                                strokeOpacity={0.5}
                                vertical={false}
                            />

                            {/* Rating tier reference lines */}
                            {RATING_TIERS.slice(0, -1).map((tier) => {
                                const [lo, hi] = yDomain;
                                if (tier.max <= lo || tier.max >= hi)
                                    return null;
                                return (
                                    <ReferenceLine
                                        key={tier.max}
                                        y={tier.max}
                                        stroke={tier.hexColor}
                                        strokeDasharray="4 4"
                                        strokeOpacity={0.4}
                                        strokeWidth={1}
                                        label={{
                                            value: tier.title,
                                            position: 'insideTopRight',
                                            fontSize: 9,
                                            fill: tier.hexColor,
                                            opacity: 0.7,
                                        }}
                                    />
                                );
                            })}

                            <XAxis
                                dataKey="contest_end_time"
                                tickFormatter={fmtShortDate}
                                tick={{
                                    fontSize: 11,
                                    fill: 'hsl(var(--muted-foreground))',
                                }}
                                axisLine={false}
                                tickLine={false}
                                dy={6}
                            />

                            <YAxis
                                domain={yDomain}
                                tick={{
                                    fontSize: 11,
                                    fill: 'hsl(var(--muted-foreground))',
                                }}
                                axisLine={false}
                                tickLine={false}
                                width={42}
                            />

                            <Tooltip
                                content={<RatingTooltip />}
                                cursor={{
                                    stroke: 'hsl(var(--border))',
                                    strokeWidth: 1,
                                    strokeDasharray: '4 4',
                                }}
                            />

                            <Area
                                type="monotone"
                                dataKey="final_rating"
                                stroke="url(#lineGradient)"
                                strokeWidth={2.5}
                                fill="url(#ratingGradient)"
                                dot={<ContestDot />}
                                activeDot={<ActiveContestDot />}
                                isAnimationActive={true}
                                animationDuration={600}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Contest list below */}
            {filtered.length > 0 && (
                <div className="border-t border-border/60">
                    <div className="max-h-52 overflow-y-auto">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-muted/60 backdrop-blur-sm">
                                <tr>
                                    <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                                        Contest
                                    </th>
                                    <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wider">
                                        Rank
                                    </th>
                                    <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wider">
                                        Change
                                    </th>
                                    <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wider">
                                        Rating
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...filtered].reverse().map((d, i) => {
                                    const rank = getRankDetails(d.final_rating);
                                    const delta = d.delta ?? 0;
                                    const isPos = delta > 0;
                                    const isZero = delta === 0;
                                    return (
                                        <tr
                                            key={d.registration_id ?? i}
                                            className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="px-4 py-2.5">
                                                <div className="font-medium text-foreground truncate max-w-[220px]">
                                                    {d.contest_title}
                                                </div>
                                                <div className="text-muted-foreground/70 mt-0.5">
                                                    {fmtDate(d.contest_end_time)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-center font-semibold text-foreground">
                                                {d.final_rank != null
                                                    ? `#${d.final_rank}`
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <span
                                                    className={`font-bold ${
                                                        isZero
                                                            ? 'text-muted-foreground'
                                                            : isPos
                                                              ? 'text-emerald-500'
                                                              : 'text-red-500'
                                                    }`}
                                                >
                                                    {isPos ? '+' : ''}
                                                    {delta}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <span
                                                    className={`font-extrabold ${rank.colorClass}`}
                                                >
                                                    {d.final_rating}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
