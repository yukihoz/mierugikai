import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';

export function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 4) {
                pages.push(1, 2, 3, 4, 5, '...', totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex justify-center items-center gap-2 mt-12 mb-8">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center justify-center p-2 text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                aria-label="前へ"
            >
                <ChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
                {getPageNumbers().map((page, index) => (
                    typeof page === 'number' ? (
                        <button
                            key={index}
                            onClick={() => onPageChange(page)}
                            className={clsx(
                                "min-w-[40px] h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all shadow-sm",
                                currentPage === page
                                    ? "bg-yellow-400 text-slate-900 border border-yellow-500 ring-2 ring-yellow-400/20"
                                    : "bg-white text-slate-600 border border-slate-200 hover:border-yellow-300 hover:bg-yellow-50"
                            )}
                        >
                            {page}
                        </button>
                    ) : (
                        <span key={index} className="px-1 text-slate-400 flex items-center justify-center h-10">
                            <MoreHorizontal size={20} />
                        </span>
                    )
                ))}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center p-2 text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                aria-label="次へ"
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
}
