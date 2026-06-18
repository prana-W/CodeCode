import {ChevronLeft, ChevronRight} from 'lucide-react';
import {Button} from '@/components/ui/button';

/**
 * Reusable pagination footer.
 *
 * Props:
 *  - currentPage   : number
 *  - totalPages    : number
 *  - total         : number   (total record count)
 *  - limit         : number   (page size)
 *  - onPrev        : () => void
 *  - onNext        : () => void
 *  - loading       : boolean  (disables buttons while fetching)
 */
export default function PaginationControls({
    currentPage,
    totalPages,
    total,
    limit,
    onPrev,
    onNext,
    loading = false,
}) {
    if (!totalPages || totalPages <= 1) return null;

    const from = (currentPage - 1) * limit + 1;
    const to = Math.min(currentPage * limit, total);

    return (
        <div className="flex items-center justify-between px-2 py-3 border-t border-border mt-0">
            <span className="text-xs text-muted-foreground font-medium select-none">
                Showing{' '}
                <span className="font-bold text-foreground">
                    {from}–{to}
                </span>{' '}
                of{' '}
                <span className="font-bold text-foreground">{total}</span>
            </span>

            <div className="flex items-center gap-2">
                <Button
                    id="pagination-prev"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs font-semibold"
                    onClick={onPrev}
                    disabled={currentPage <= 1 || loading}
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev
                </Button>

                <span className="text-xs font-bold text-muted-foreground px-1 select-none">
                    {currentPage} / {totalPages}
                </span>

                <Button
                    id="pagination-next"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs font-semibold"
                    onClick={onNext}
                    disabled={currentPage >= totalPages || loading}
                >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    );
}
