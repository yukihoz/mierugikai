import { useRef, useEffect, useState } from 'react';
import { X, Calendar, User, Link as LinkIcon, Check } from 'lucide-react';
import clsx from 'clsx';
import { HighlightedText } from './HighlightedText';

export function ContextModal({ isOpen, onClose, selectedItem, contextItems, query }) {
    const itemRefs = useRef({});
    const scrollContainerRef = useRef(null);
    const [copiedId, setCopiedId] = useState(null);

    const handleCopy = (e, id) => {
        e.stopPropagation();
        const url = `${window.location.origin}${import.meta.env.BASE_URL}${id}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    useEffect(() => {
        if (isOpen && selectedItem && itemRefs.current[selectedItem.body]) {
            // Scroll to the selected item
            itemRefs.current[selectedItem.body].scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [isOpen, selectedItem]);

    if (!isOpen || !selectedItem) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-start justify-between bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg line-clamp-1">{selectedItem.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <Calendar size={14} />
                            <span>{selectedItem.year}年度 ({selectedItem.date})</span>
                            <span>•</span>
                            <span>{selectedItem.type}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                    {contextItems.map((item, i) => {
                        const isSelected = item === selectedItem;
                        return (
                            <div
                                key={i}
                                ref={(el) => (itemRefs.current[item.body] = el)}
                                className={clsx(
                                    "p-4 rounded-xl border transition-all",
                                    isSelected
                                        ? "bg-amber-50 border-amber-200 shadow-md ring-1 ring-amber-100"
                                        : item.is_unofficial
                                            ? "bg-slate-100 border-slate-200"
                                            : "bg-white border-slate-100"
                                )}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                                    {/* Left: Speaker Info */}
                                    {/* Left: Speaker Info */}
                                    <div className="flex items-center gap-2 text-slate-900">
                                        {/* Icon Removed (Moved inside badge) */}

                                        {/* Role Badge */}
                                        {item.content_classification && item.content_classification !== '0' && (
                                            <span className={clsx(
                                                "px-2 py-1 rounded text-xs font-bold flex items-center gap-1",
                                                item.content_classification.includes('理事者') ? "bg-purple-100 text-purple-700" :
                                                    item.content_classification.includes('委員長') ? "bg-orange-100 text-orange-700" :
                                                        item.content_classification.includes('議長') ? "bg-amber-100 text-amber-700" :
                                                            item.content_classification.includes('議員') ? "bg-green-100 text-green-700" :
                                                                "bg-blue-100 text-blue-700"
                                            )}>
                                                <User size={12} />
                                                {item.content_classification}
                                            </span>
                                        )}

                                        <span className="text-lg font-bold">
                                            {item.speaker}
                                        </span>
                                    </div>

                                    {/* Right: Category Badge */}
                                    {item.category && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                            <User size={12} className="text-slate-400" />
                                            {item.category}
                                        </span>
                                    )}
                                </div>
                                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                                    <HighlightedText text={item.body} highlight={query} />
                                </div>
                                <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-100/50">
                                    <span className="text-[10px] text-slate-300 font-mono tracking-wider">ID: {item.id}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => handleCopy(e, item.id)}
                                        className={clsx(
                                            "flex items-center justify-center p-1.5 rounded transition-colors",
                                            copiedId === item.id
                                                ? "bg-green-50 text-green-600 border border-green-200"
                                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                        )}
                                        title={copiedId === item.id ? "コピー完了" : "この発言のURLをコピー"}
                                    >
                                        {copiedId === item.id ? <Check size={14} /> : <LinkIcon size={14} />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
