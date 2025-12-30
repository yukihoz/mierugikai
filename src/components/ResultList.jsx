import { useMemo } from 'react';
import { Calendar, User, MessageSquare, ExternalLink } from 'lucide-react';
import clsx from 'clsx';
import { HighlightedText } from './HighlightedText';

export function ResultList({ results, query, onContextClick }) {
    if (results.length === 0) {
        return (
            <div className="text-center py-20 text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">該当する議事録が見つかりませんでした</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4 px-2">
                検索結果: {results.length}件
            </h2>
            {results.map((item, index) => (
                <div
                    key={index}
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
                >
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            {/* Speaker Section (Primary) */}
                            <span className="flex items-center gap-2 text-slate-900">
                                {/* Icon */}
                                <User size={20} className="text-slate-400" />

                                {/* Role Badge */}
                                {item.content_classification && (
                                    <span className={clsx(
                                        "px-2 py-0.5 rounded text-[10px] font-bold",
                                        item.content_classification.includes('理事者') ? "bg-purple-100 text-purple-700" :
                                            item.content_classification.includes('委員長') ? "bg-orange-100 text-orange-700" :
                                                item.content_classification.includes('議長') ? "bg-amber-100 text-amber-700" :
                                                    item.content_classification.includes('議員') ? "bg-green-100 text-green-700" :
                                                        "bg-blue-100 text-blue-700"
                                    )}>
                                        {item.content_classification}
                                    </span>
                                )}

                                {/* Speaker Name (Large) */}
                                <span className="text-lg font-bold">
                                    {item.speaker}
                                </span>

                                {/* Category (Always visible) */}
                                {item.category && (
                                    <span className="flex items-center gap-1 ml-2 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                        <User size={12} className="text-slate-400" />
                                        {item.category}
                                    </span>
                                )}
                            </span>

                            <span className="w-px h-5 bg-slate-200 mx-1 hidden sm:block"></span>

                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded text-xs ml-auto sm:ml-0">
                                <Calendar size={12} />
                                {item.year}年度 ({item.date}) • {item.type}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onContextClick(item);
                            }}
                            className="relative z-10 flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg text-sm font-bold transition-colors shadow-sm shrink-0"
                        >
                            <ExternalLink size={16} />
                            文脈を表示
                        </button>
                    </div>

                    <div className="text-slate-700 leading-relaxed text-base whitespace-pre-wrap">
                        <HighlightedText text={item.body} highlight={query} />
                    </div>

                    <div className="mt-2 text-right">
                        <span className="text-[10px] text-slate-300 font-mono tracking-wider">ID: {item.id}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
