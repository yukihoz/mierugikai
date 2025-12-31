import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { YearRangeSlider } from './YearRangeSlider';

export function FilterPanel({
    filters,
    setFilters,
    options,
    speakerMeta
}) {
    const [isOpen, setIsOpen] = useState(false); // Default collapsed

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
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-8 overflow-hidden transition-all duration-300">
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

                    {/* Year Range Slider - Full Width */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <label className="block text-sm font-medium text-slate-600 mb-1">対象期間 (年度)</label>
                        <YearRangeSlider
                            min={minYear}
                            max={maxYear}
                            value={currentRange}
                            onChange={handleRangeChange}
                        />
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
    );
}
