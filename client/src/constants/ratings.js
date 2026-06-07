/**
 * Rating thresholds, titles, and text colors based on competitive programming ranks.
 */
export const RATING_TIERS = [
    { max: 1200, title: 'Newbie', colorClass: 'text-gray-500', hexColor: '#808080' },
    { max: 1400, title: 'Pupil', colorClass: 'text-green-500', hexColor: '#008000' },
    { max: 1600, title: 'Specialist', colorClass: 'text-cyan-500', hexColor: '#03a89e' },
    { max: 1900, title: 'Expert', colorClass: 'text-blue-500', hexColor: '#0000ff' },
    { max: 2100, title: 'Candidate Master', colorClass: 'text-purple-500', hexColor: '#aa00aa' },
    { max: 2300, title: 'Master', colorClass: 'text-orange-400', hexColor: '#ff8c00' },
    { max: 2400, title: 'International Master', colorClass: 'text-orange-500', hexColor: '#ff8c00' },
    { max: 2600, title: 'Grandmaster', colorClass: 'text-red-500', hexColor: '#ff0000' },
    { max: 3000, title: 'International Grandmaster', colorClass: 'text-red-600', hexColor: '#cc0000' },
    { max: Infinity, title: 'Legendary Grandmaster', colorClass: 'text-red-700 font-bold', hexColor: '#aa0000' }
];

/**
 * Get rank title, text color class, and hex color by rating.
 */
export const getRankDetails = (rating) => {
    if (rating === undefined || rating === null || isNaN(Number(rating))) {
        return { title: 'Unrated', colorClass: 'text-gray-500', hexColor: '#808080' };
    }
    const val = Number(rating);
    const tier = RATING_TIERS.find(t => val < t.max);
    return tier || RATING_TIERS[RATING_TIERS.length - 1];
};

/**
 * Division mapping for displaying contest info.
 */
export const DIV_LABELS = {
    1: { label: 'Div. 1', desc: 'Expert (2100+)' },
    2: { label: 'Div. 2', desc: 'Specialist (1600–2100)' },
    3: { label: 'Div. 3', desc: 'Pupil (1200–1600)' },
    4: { label: 'Div. 4', desc: 'Newbie (800–1200)' },
    5: { label: 'Div. 5', desc: 'Unrated' },
};

/**
 * Division list for selects and dropdowns.
 */
export const DIVISION_TIERS = [
    { v: '1', label: 'Division 1 — Expert', desc: '2100+' },
    { v: '2', label: 'Division 2 — Specialist', desc: '1600–2100' },
    { v: '3', label: 'Division 3 — Pupil', desc: '1200–1600' },
    { v: '4', label: 'Division 4 — Newbie', desc: '800–1200' },
    { v: '5', label: 'Division 5 — Unrated', desc: 'Open' },
];
