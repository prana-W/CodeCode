import {useState, useMemo} from 'react';
import {Flame, Zap, CheckCircle2, Code2} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildGrid(year, heatmap) {
    // index heatmap by day string for O(1) lookup
    const map = {};
    for (const row of heatmap) {
        map[row.day] = row;
    }

    // Jan 1 of the year
    const jan1 = new Date(year, 0, 1);
    const startDow = jan1.getDay(); // 0=Sun

    // Total days in year
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const totalDays = isLeap ? 366 : 365;

    // Build array of day cells: { dateStr, dow, month, total, accepted }
    const cells = [];
    for (let i = 0; i < totalDays; i++) {
        const d = new Date(year, 0, i + 1);
        const dateStr = d.toISOString().slice(0, 10);
        const data = map[dateStr];
        cells.push({
            dateStr,
            dow: d.getDay(),
            month: d.getMonth(),
            day: d.getDate(),
            total: data?.total ?? 0,
            accepted: data?.accepted ?? 0,
        });
    }

    // Pad the front with empty cells so the grid starts on Sunday
    const paddedCells = [...Array(startDow).fill(null), ...cells];

    // Split into columns of 7 (weeks)
    const weeks = [];
    for (let i = 0; i < paddedCells.length; i += 7) {
        weeks.push(paddedCells.slice(i, i + 7));
    }

    return {weeks, cells};
}

// intensity: 0–4 levels based on accepted count
function intensityLevel(accepted) {
    if (accepted === 0) return 0;
    if (accepted <= 1) return 1;
    if (accepted <= 3) return 2;
    if (accepted <= 6) return 3;
    return 4;
}

const INTENSITY_CLASSES = [
    'bg-muted/40 border-border/30', // 0 – empty
    'bg-emerald-500/25 border-emerald-500/20', // 1
    'bg-emerald-500/50 border-emerald-500/30', // 2
    'bg-emerald-500/75 border-emerald-500/40', // 3
    'bg-emerald-500    border-emerald-600/60', // 4
];

const YEAR_RANGE = 3; // show current year and 2 previous years in selector

// ─── stat pill ──────────────────────────────────────────────────────────────

function StatPill({icon: Icon, label, value, className = ''}) {
    return (
        <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border bg-muted/20 ${className}`}
        >
            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none mb-0.5">
                    {label}
                </p>
                <p className="text-base font-extrabold text-foreground leading-none">
                    {value}
                </p>
            </div>
        </div>
    );
}

// ─── tooltip ────────────────────────────────────────────────────────────────

function CellTooltip({info}) {
    if (!info) return null;
    const {cell, rect} = info;
    const date = new Date(cell.dateStr + 'T00:00:00');
    const label = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const top = rect.top - 8;
    const left = rect.left + rect.width / 2;

    return (
        <div
            className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-full
                        bg-popover border border-border rounded-lg shadow-xl px-3 py-2 text-xs whitespace-nowrap"
            style={{top, left}}
        >
            <p className="font-semibold text-foreground mb-1">{label}</p>
            <p className="text-muted-foreground">
                <span className="text-emerald-500 font-bold">
                    {cell.accepted}
                </span>{' '}
                accepted
                {' · '}
                <span className="font-bold text-foreground">
                    {cell.total}
                </span>{' '}
                total
            </p>
        </div>
    );
}

// ─── month-label positions ───────────────────────────────────────────────────

function buildMonthLabels(weeks) {
    // Find the column index where each month first appears
    const seen = new Set();
    const labels = [];
    weeks.forEach((week, colIdx) => {
        for (const cell of week) {
            if (!cell) continue;
            if (!seen.has(cell.month)) {
                seen.add(cell.month);
                labels.push({colIdx, month: cell.month});
            }
        }
    });
    return labels;
}

// ─── main component ─────────────────────────────────────────────────────────

export default function ActivityHeatmap({stats, loading, onYearChange}) {
    const [hoveredCell, setHoveredCell] = useState(null);
    const currentYear = new Date().getFullYear();

    const year = stats?.year ?? currentYear;
    const heatmap = stats?.heatmap ?? [];

    const years = Array.from({length: YEAR_RANGE}, (_, i) => currentYear - i);

    const {weeks} = useMemo(() => buildGrid(year, heatmap), [year, heatmap]);
    const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks]);

    if (loading) {
        return (
            <div className="rounded-xl border border-border bg-card/50 p-6">
                <div className="h-5 skeleton rounded w-40 mb-4" />
                <div className="h-28 skeleton rounded" />
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
            {/* header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-4 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Code2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-foreground">
                            Submission Activity
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {stats?.yearAccepted ?? 0} accepted in {year}
                        </p>
                    </div>
                </div>

                {/* year selector */}
                <div className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-1">
                    {years.map((y) => (
                        <button
                            key={y}
                            onClick={() => onYearChange(y)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
                                y === year
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {y}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-5 pt-4 pb-5">
                {/* streak / stat pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                    <StatPill
                        icon={Flame}
                        label="Current Streak"
                        value={`${stats?.currentStreak ?? 0}d`}
                    />
                    <StatPill
                        icon={Zap}
                        label="Longest Streak"
                        value={`${stats?.longestStreak ?? 0}d`}
                    />
                    <StatPill
                        icon={CheckCircle2}
                        label="Solved This Year"
                        value={stats?.yearAccepted ?? 0}
                    />
                    <StatPill
                        icon={Code2}
                        label="Total Solved"
                        value={stats?.allTimeAccepted ?? 0}
                    />
                </div>

                {/* heatmap grid */}
                <div className="w-full">
                    <div className="flex flex-col w-full">
                        {/* month labels */}
                        <div className="flex w-full gap-[2px] mb-1">
                            {weeks.map((_, colIdx) => {
                                const label = monthLabels.find(
                                    (m) => m.colIdx === colIdx
                                );
                                return (
                                    <div
                                        key={colIdx}
                                        className="flex-1 text-[10px] text-muted-foreground font-medium"
                                        style={{
                                            overflow: 'visible',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {label ? MONTHS[label.month] : ''}
                                    </div>
                                );
                            })}
                        </div>

                        {/* rows = days of week (0=Sun … 6=Sat) */}
                        <div className="flex w-full gap-[2px]">
                            {/* columns = weeks */}
                            {weeks.map((week, colIdx) => {
                                return (
                                    <div
                                        key={colIdx}
                                        className="flex flex-col flex-1 gap-[2px]"
                                    >
                                        {week.map((cell, rowIdx) => {
                                            if (!cell) {
                                                return (
                                                    <div
                                                        key={rowIdx}
                                                        className="w-full aspect-square rounded-[2px]"
                                                    />
                                                );
                                            }
                                            const level = intensityLevel(
                                                cell.accepted
                                            );
                                            const isHovered =
                                                hoveredCell?.dateStr ===
                                                cell.dateStr;

                                            const today = new Date();
                                            const todayStr = new Date(
                                                today.getTime() -
                                                    today.getTimezoneOffset() *
                                                        60000
                                            )
                                                .toISOString()
                                                .slice(0, 10);
                                            const isPast =
                                                cell.dateStr <= todayStr;

                                            let cellClass =
                                                INTENSITY_CLASSES[level];
                                            if (level === 0 && isPast) {
                                                cellClass =
                                                    'bg-muted/80 border-border/50';
                                            }

                                            return (
                                                <div
                                                    key={rowIdx}
                                                    className={`w-full aspect-square rounded-[2px] border cursor-pointer transition-colors
                                                    ${cellClass}
                                                    ${isHovered ? 'ring-1 ring-emerald-400 ring-offset-1 ring-offset-background z-10' : ''}`}
                                                    onMouseEnter={(e) => {
                                                        const rect =
                                                            e.target.getBoundingClientRect();
                                                        setHoveredCell({
                                                            cell,
                                                            rect,
                                                        });
                                                    }}
                                                    onMouseLeave={() =>
                                                        setHoveredCell(null)
                                                    }
                                                />
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* legend */}
                <div className="flex items-center justify-end gap-1.5 mt-3">
                    <span className="text-[10px] text-muted-foreground mr-0.5">
                        Less
                    </span>
                    {INTENSITY_CLASSES.map((cls, i) => (
                        <div
                            key={i}
                            className={`w-[11px] h-[11px] rounded-[2px] border ${cls}`}
                        />
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-0.5">
                        More
                    </span>
                </div>
            </div>

            <CellTooltip info={hoveredCell} />
        </div>
    );
}
