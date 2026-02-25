import { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

export function FilterPanel({
    filters,
    setFilters,
    options,
    speakerMeta
}) {
    const [isOpen, setIsOpen] = useState(false); // Default collapsed
    const [swingKey, setSwingKey] = useState(0);

    // Trigger swing animation whenever panel opens or closes
    useEffect(() => {
        setSwingKey(prev => prev + 1);
    }, [isOpen]);

    const handleRangeChange = (newRange) => {
        setFilters(prev => ({ ...prev, yearRange: newRange }));
    };

    const handleChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const hasActiveFilters =
        Boolean(filters.committee) ||
        Boolean(filters.category) ||
        (filters.yearRange && (filters.yearRange[0] !== 2015 || filters.yearRange[1] !== options.maxYear));

    // Ensure we have min/max for the slider
    const minYear = options.minYear || 2003;
    const maxYear = options.maxYear || 2025;
    const currentRange = filters.yearRange || [minYear, maxYear];

    return (
        <div className="relative mb-8">
            <style>
                {`
                @keyframes swing {
                    0% { transform: rotate(0deg); }
                    25% { transform: rotate(15deg); }
                    50% { transform: rotate(0deg); }
                    75% { transform: rotate(-15deg); }
                    100% { transform: rotate(0deg); }
                }
                .animate-swing {
                    animation: swing 1s ease-in-out 2;
                }
                `}
            </style>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 relative z-10">
                <div
                    className="p-6 flex items-center justify-between cursor-pointer bg-white hover:bg-slate-50 transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <Filter size={18} className="text-primary-500" />
                        絞り込み検索
                    </h3>
                    <div className="flex items-center gap-4">
                        {!isOpen && <span className="text-xs font-normal text-slate-500">クリックして条件を表示</span>}
                        {isOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                    </div>
                </div>

                {isOpen && (
                    <div className="px-6 pb-6 pt-0 border-t border-slate-50 space-y-6 animate-in slide-in-from-top-2 duration-200">
                        {/* Reset Button Area */}
                        <div className="flex justify-end pt-4">
                            {hasActiveFilters && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFilters({ committee: '', category: '', yearRange: [2015, options.maxYear || 2025], sort: 'desc' });
                                    }}
                                    className="text-sm text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-red-50 cursor-pointer"
                                >
                                    <X size={14} />
                                    条件をリセット
                                </button>
                            )}
                        </div>

                        {/* Year Range Dropdowns */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">開始年度</label>
                                <select
                                    value={currentRange[0]}
                                    onChange={(e) => {
                                        const newStart = parseInt(e.target.value, 10);
                                        // If new start is after current end, adjust end to match start
                                        const newEnd = newStart > currentRange[1] ? newStart : currentRange[1];
                                        handleRangeChange([newStart, newEnd]);
                                    }}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    {Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i).map(year => (
                                        <option key={`start-${year}`} value={year}>{year}年度</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">終了年度</label>
                                <select
                                    value={currentRange[1]}
                                    onChange={(e) => {
                                        const newEnd = parseInt(e.target.value, 10);
                                        // If new end is before current start, adjust start to match end
                                        const newStart = newEnd < currentRange[0] ? newEnd : currentRange[0];
                                        handleRangeChange([newStart, newEnd]);
                                    }}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    {Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i).map(year => (
                                        <option key={`end-${year}`} value={year}>{year}年度</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Committee Filter */}
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">会議名</label>
                                <select
                                    value={filters.committee}
                                    onChange={(e) => handleChange('committee', e.target.value)}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">全ての会議</option>
                                    {options.committees.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Category Filter */}
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">人分類</label>
                                <select
                                    value={filters.category}
                                    onChange={(e) => handleChange('category', e.target.value)}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">全ての分類</option>
                                    {options.categories.map(s => {
                                        const meta = speakerMeta?.[s];
                                        const label = meta?.kana ? `${s}（${meta.kana}）` : s;
                                        return <option key={s} value={s}>{label}</option>
                                    })}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Swinging Character Image */}
            <div className="absolute top-full left-[40%] -translate-x-1/2 -mt-2 z-0">
                <img
                    key={swingKey}
                    src={`${import.meta.env.BASE_URL}images/gijie_burabura.png`}
                    alt=""
                    className="h-12 md:h-14 w-auto object-contain origin-top transition-transform duration-300 animate-swing"
                />
            </div>
        </div>
    );
}
