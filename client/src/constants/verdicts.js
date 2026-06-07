/**
 * Verdict metadata including human-readable label and Tailwind color styles.
 */
export const VERDICT_TIERS = {
    accepted: {
        label: 'Accepted',
        colorClass:
            'text-green-600 bg-green-500/10 dark:text-green-400 dark:bg-green-500/20 font-bold',
    },
    wrong_answer: {
        label: 'Wrong Answer',
        colorClass:
            'text-red-600 bg-red-500/10 dark:text-red-400 dark:bg-red-500/20 font-bold',
    },
    time_limit_exceeded: {
        label: 'Time Limit Exceeded',
        colorClass:
            'text-orange-600 bg-orange-500/10 dark:text-orange-400 dark:bg-orange-500/20 font-semibold',
    },
    memory_limit_exceeded: {
        label: 'Memory Limit Exceeded',
        colorClass:
            'text-orange-600 bg-orange-500/10 dark:text-orange-400 dark:bg-orange-500/20 font-semibold',
    },
    compilation_error: {
        label: 'Compilation Error',
        colorClass:
            'text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20 font-semibold',
    },
    runtime_error: {
        label: 'Runtime Error',
        colorClass:
            'text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20 font-semibold',
    },
    pending: {
        label: 'Pending',
        colorClass: 'text-muted-foreground bg-muted font-medium animate-pulse',
    },
    running: {
        label: 'Running',
        colorClass:
            'text-blue-600 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-500/20 font-semibold animate-pulse',
    },
};

/**
 * Helper to fetch verdict label and color scheme by db verdict string.
 */
export const getVerdictDetails = (verdict) => {
    if (!verdict) {
        return VERDICT_TIERS.pending;
    }
    const key = verdict.toLowerCase().trim();
    return (
        VERDICT_TIERS[key] || {
            label: verdict,
            colorClass: 'text-muted-foreground bg-muted font-medium',
        }
    );
};
