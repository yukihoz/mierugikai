import { User } from 'lucide-react';

export function TopSpeakers({ data, onCategoryClick, currentCategory }) {
    if (!data || data.length === 0) return null;

    // Calculate Top Speakers (using Category as requested)
    const speakerCounts = data.reduce((acc, item) => {
        if (item.category === '0') return acc;
        const name = item.category || '不明'; // Use category
        acc[name] = (acc[name] || 0) + 1;
        return acc;
    }, {});

    const sortedSpeakers = Object.entries(speakerCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 30); // Top 30 for scrolling

    // Find max for bar scaling
    const maxCount = sortedSpeakers[0]?.[1] || 1;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-yellow-200 h-full overflow-y-auto">
            <div className="flex items-center justify-center gap-2 mb-4 relative">
                <h3 className="font-bold text-slate-700">発言者ランキング</h3>
                {currentCategory && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCategoryClick('');
                        }}
                        className="absolute right-0 text-xs bg-slate-100 hover:bg-slate-200 text-slate-500 px-2 py-1 rounded transition-colors"
                    >
                        解除
                    </button>
                )}
            </div>
            <div className="space-y-3">
                {sortedSpeakers.map(([name, count], index) => (
                    <div
                        key={name}
                        onClick={() => onCategoryClick && onCategoryClick(name)}
                        className="flex items-center gap-3 cursor-pointer hover:bg-yellow-50 p-2 rounded-lg transition-colors group"
                    >
                        <div className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                            ${index < 3 ? 'bg-yellow-400 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-yellow-200 group-hover:text-yellow-800'}
                        `}>
                            {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-sm font-medium text-slate-700 truncate group-hover:text-yellow-800">{name}</span>
                                <span className="text-xs text-slate-500 group-hover:text-yellow-700">{count}回</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-yellow-400 h-full rounded-full"
                                    style={{ width: `${(count / maxCount) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
