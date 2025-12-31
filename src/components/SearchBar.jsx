import { Search } from 'lucide-react';

export function SearchBar({ value, onChange, onSearch }) {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            onSearch();
        }
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto mb-8">
            <div className="relative flex items-center">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="あなたの気になるキーワード (例: 待機児童, 再開発...)"
                    className="w-full pl-6 pr-14 py-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg transition-all"
                />
                <button
                    onClick={onSearch}
                    className="absolute right-2 p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                    <Search className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}
