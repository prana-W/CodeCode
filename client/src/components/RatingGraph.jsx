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
    ReferenceArea,
    Dot,
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Trophy,
    LineChart,
    List,
} from 'lucide-react';
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

function ContestDot(props) {
    const {cx, cy, payload, onMouseEnter, onMouseLeave} = props;
    const rank = getRankDetails(payload.final_rating);
    return (
        <circle
            cx={cx}
            cy={cy}
            r={5}
            fill={rank.hexColor}
            stroke="hsl(var(--background))"
            strokeWidth={1.5}
            style={{cursor: 'pointer', pointerEvents: 'all'}}
            onMouseEnter={(e) => onMouseEnter(e, payload, cx, cy)}
            onMouseLeave={onMouseLeave}
        />
    );
}

function ActiveContestDot(props) {
    const {cx, cy, payload, onMouseLeave} = props;
    const rank = getRankDetails(payload.final_rating);
    return (
        <circle
            cx={cx}
            cy={cy}
            r={7}
            fill={rank.hexColor}
            stroke="white"
            strokeWidth={2}
            style={{
                filter: `drop-shadow(0 0 4px ${rank.hexColor}88)`,
                cursor: 'pointer',
                pointerEvents: 'all',
            }}
            onMouseLeave={onMouseLeave}
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
    const [activeTab, setActiveTab] = useState('graph');

    const [xDomain, setXDomain] = useState(['dataMin', 'dataMax']);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(null);

    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({x: 0, y: 0});

    const processedHistory = useMemo(() => {
        if (!history?.length) return [];
        return history
            .map((d) => ({
                ...d,
                timestamp: new Date(d.contest_end_time).getTime(),
            }))
            .sort((a, b) => a.timestamp - b.timestamp);
    }, [history]);

    const filtered = useMemo(() => {
        if (!processedHistory.length) return [];
        const selected = RANGES.find((r) => r.label === range);
        if (!selected?.months) return processedHistory;
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - selected.months);
        return processedHistory.filter((d) => d.timestamp >= cutoff.getTime());
    }, [processedHistory, range]);

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
                const pct = Math.max(0, Math.min(1, (tier.max - minR) / span));
                return {offset: `${(1 - pct) * 100}%`, color: tier.hexColor};
            });
    }, [filtered]);

    // Y-axis domain with a bit of padding
    const yDomain = useMemo(() => {
        if (!processedHistory.length) return ['auto', 'auto'];
        const vals = processedHistory.map((d) => d.final_rating);
        const mn = Math.min(...vals);
        const mx = Math.max(...vals);
        const pad = Math.max(100, Math.round((mx - mn) * 0.15));
        return [Math.max(0, mn - pad), mx + pad];
    }, [processedHistory]);

    // Handle range switcher update to XDomain
    const handleRangeChange = (label) => {
        setRange(label);
        if (!processedHistory.length) return;
        const selected = RANGES.find((r) => r.label === label);
        if (!selected?.months) {
            setXDomain(['dataMin', 'dataMax']);
            return;
        }
        const maxT = processedHistory[processedHistory.length - 1].timestamp;
        const cutoff = new Date(maxT);
        cutoff.setMonth(cutoff.getMonth() - selected.months);
        setXDomain([cutoff.getTime(), maxT]);
    };

    // Zooming
    const handleWheel = (e) => {
        if (processedHistory.length === 0) return;
        e.preventDefault(); // prevent page scroll while hovering over graph

        const currentMin =
            xDomain[0] === 'dataMin'
                ? processedHistory[0].timestamp
                : xDomain[0];
        const currentMax =
            xDomain[1] === 'dataMax'
                ? processedHistory[processedHistory.length - 1].timestamp
                : xDomain[1];

        const span = currentMax - currentMin;
        const zoomFactor = e.deltaY > 0 ? 1.15 : 0.85; // zoom out if positive, in if negative
        const center = (currentMin + currentMax) / 2;
        let newSpan = span * zoomFactor;

        // Limit zoom to a minimum of ~1 week and maximum of 3x total history
        const MIN_SPAN = 7 * 24 * 60 * 60 * 1000;
        const MAX_SPAN =
            (processedHistory[processedHistory.length - 1].timestamp -
                processedHistory[0].timestamp) *
                3 || MIN_SPAN * 4;

        if (newSpan < MIN_SPAN) newSpan = MIN_SPAN;
        if (newSpan > MAX_SPAN) newSpan = MAX_SPAN;

        setXDomain([center - newSpan / 2, center + newSpan / 2]);
    };

    // Panning
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStartX(e.clientX);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartX;
        if (dx === 0) return;

        const currentMin =
            xDomain[0] === 'dataMin'
                ? processedHistory[0].timestamp
                : xDomain[0];
        const currentMax =
            xDomain[1] === 'dataMax'
                ? processedHistory[processedHistory.length - 1].timestamp
                : xDomain[1];
        const span = currentMax - currentMin;

        const pixelWidth = 800; // approximate view width for scaling drag
        const timeShift = (dx / pixelWidth) * span;

        setXDomain([currentMin - timeShift, currentMax - timeShift]);
        setDragStartX(e.clientX);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDragStartX(null);
    };

    if (loading) {
        return (
            <div className="rounded-xl border border-border bg-card/50 p-6">
                <div className="h-6 skeleton rounded w-48 mb-6" />
                <div className="h-64 skeleton rounded" />
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card/50">
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

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('graph')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                            activeTab === 'graph'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <LineChart className="w-3.5 h-3.5" /> Graph
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                            activeTab === 'history'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <List className="w-3.5 h-3.5" /> History
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'graph' ? (
                <div
                    className="px-4 pt-4 pb-6 relative h-[320px]"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* Range switcher for Graph only */}
                    <div className="absolute top-4 right-6 flex items-center gap-0.5 bg-muted/60 rounded-lg p-1 z-10">
                        {RANGES.map(({label}) => (
                            <button
                                key={label}
                                onClick={() => handleRangeChange(label)}
                                className={`text-[10px] font-semibold px-2.5 py-1 rounded-md transition-all ${
                                    range === label
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
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
                        <>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={processedHistory}
                                    margin={{
                                        top: 10,
                                        right: 16,
                                        left: 0,
                                        bottom: 0,
                                    }}
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
                                        stroke="var(--border)"
                                        strokeOpacity={0.3}
                                        vertical={false}
                                    />

                                    {/* Background Color Bands for Rating Tiers */}
                                    {RATING_TIERS.map((tier, i) => {
                                        const prevMax =
                                            i === 0
                                                ? 0
                                                : RATING_TIERS[i - 1].max;
                                        const [lo, hi] = yDomain;
                                        if (prevMax >= hi || tier.max <= lo)
                                            return null;
                                        return (
                                            <ReferenceArea
                                                key={tier.title}
                                                y1={Math.max(lo, prevMax)}
                                                y2={
                                                    tier.max === Infinity
                                                        ? hi
                                                        : Math.min(hi, tier.max)
                                                }
                                                fill={tier.hexColor}
                                                fillOpacity={0.06}
                                                strokeOpacity={0}
                                            />
                                        );
                                    })}

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
                                        dataKey="timestamp"
                                        type="number"
                                        domain={xDomain}
                                        tickFormatter={fmtShortDate}
                                        tick={{
                                            fontSize: 11,
                                            fill: 'currentColor',
                                            className: 'text-muted-foreground',
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={6}
                                        scale="time"
                                    />

                                    <YAxis
                                        domain={yDomain}
                                        tick={{
                                            fontSize: 11,
                                            fill: 'currentColor',
                                            className: 'text-muted-foreground',
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={42}
                                    />

                                    <Tooltip
                                        content={() => null}
                                        cursor={false}
                                    />

                                    <Area
                                        type="monotone"
                                        dataKey="final_rating"
                                        stroke="url(#lineGradient)"
                                        strokeWidth={2.5}
                                        fill="url(#ratingGradient)"
                                        dot={
                                            <ContestDot
                                                onMouseEnter={(
                                                    e,
                                                    payload,
                                                    cx,
                                                    cy
                                                ) => {
                                                    setHoveredPoint(payload);
                                                    setTooltipPos({
                                                        x: cx,
                                                        y: cy,
                                                    });
                                                }}
                                                onMouseLeave={() =>
                                                    setHoveredPoint(null)
                                                }
                                            />
                                        }
                                        activeDot={false}
                                        isAnimationActive={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>

                            {/* Custom Overlay Tooltip */}
                            {hoveredPoint && (
                                <div
                                    className="absolute pointer-events-none z-[100] transition-all duration-100 ease-out"
                                    style={{
                                        left: tooltipPos.x,
                                        top: tooltipPos.y,
                                        transform: 'translate(-50%, -115%)',
                                    }}
                                >
                                    <RatingTooltip
                                        active={true}
                                        payload={[{payload: hoveredPoint}]}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            ) : (
                /* Contest list below */
                <div className="border-t border-border/60">
                    <div className="w-full h-[320px] overflow-y-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-muted/30 sticky top-0 backdrop-blur-sm z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left font-bold text-muted-foreground uppercase tracking-wider">
                                        Contest
                                    </th>
                                    <th className="px-6 py-3 text-center font-bold text-muted-foreground uppercase tracking-wider">
                                        Rank
                                    </th>
                                    <th className="px-6 py-3 text-center font-bold text-muted-foreground uppercase tracking-wider">
                                        Change
                                    </th>
                                    <th className="px-6 py-3 text-center font-bold text-muted-foreground uppercase tracking-wider">
                                        Rating
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...history].reverse().map((d, i) => {
                                    const rank = getRankDetails(d.final_rating);
                                    const delta = d.delta ?? 0;
                                    const isPos = delta > 0;
                                    const isZero = delta === 0;
                                    return (
                                        <tr
                                            key={d.registration_id ?? i}
                                            className="border-b border-border/40 hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-sm text-foreground mb-0.5">
                                                    {d.contest_title}
                                                </div>
                                                <div className="text-muted-foreground flex items-center gap-2">
                                                    <span>
                                                        {fmtDate(
                                                            d.contest_end_time
                                                        )}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-border"></span>
                                                    <span>
                                                        Div. {d.division}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-foreground text-sm">
                                                {d.final_rank != null
                                                    ? `#${d.final_rank}`
                                                    : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={`font-bold text-sm ${
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
                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={`font-extrabold text-sm ${rank.colorClass}`}
                                                >
                                                    {d.final_rating}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {history.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-12 text-center text-muted-foreground"
                                        >
                                            No rated contests participated yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
