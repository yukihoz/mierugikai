import { useMemo } from 'react';
import clsx from 'clsx';
import { Search } from 'lucide-react';

// Simple Japanese Stopwords
const STOP_WORDS = new Set([
    'の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある', 'いる', 'も', 'する', 'から', 'な', 'こと', 'として',
    'い', 'や', 'れる', 'それ', 'この', 'その', 'という', 'ます', 'ん', 'なる', 'ため', '化', 'など', '等', '及び', 'および',
    'について', 'において', 'にて', 'により', 'による', '的', 'だ', 'です', 'ます', 'ない', 'あり', 'おり', 'られ', 'よう', '点'
]);

export function RelatedKeywords({ data, query, onKeywordClick }) {
    const words = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Check for Intl.Segmenter support (safe fallback)
        if (typeof Intl === 'undefined' || !Intl.Segmenter) {
            return [];
        }

        const segmenter = new Intl.Segmenter("ja", { granularity: "word" });
        // Analyze a subset if data is too large to prevent freezing
        const textToAnalyze = data.slice(0, 200).map(d => d.body).filter(Boolean).join("\n");
        const segments = segmenter.segment(textToAnalyze);

        const counts = {};

        for (const { segment, isWordLike } of segments) {
            if (!isWordLike) continue;

            const word = segment.trim();
            if (word.length < 3) continue; // Limit to 3+ chars

            // Heuristic: Noun Filtering
            // 1. Must contain at least one Kanji or Katakana (Excludes pure Hiragana function words, numbers, etc.)
            if (!/[一-龠々〆ヵヶァ-ヴー]/.test(word)) continue;

            // 2. Exclude words ending in typical Verb/Adjective hiragana suffixes
            // (Verbs usually end in u-sounds, Adjectives in i/na, Conjugations in te/ta)
            // Allowed Hiragana endings for nouns: ん (e.g. 提案), き (e.g. 動き), み (e.g. 取り組み), さ (e.g. 高さ)
            if (/[うくすつぬふむるいたてでな]$/.test(word)) continue;

            // 3. Explicit suffix block for common polite/grammatical endings
            if (['ます', 'です', 'した', 'ません', 'こと', 'もの', 'とき', 'ところ', 'たち', 'わけ', 'ため', 'とおり', 'さん', 'くん', '君'].some(suffix => word.endsWith(suffix))) continue;

            if (STOP_WORDS.has(word)) continue;
            // Skip query words
            if (query && query.includes(word)) continue;

            counts[word] = (counts[word] || 0) + 1;
        }

        // Convert to array, sort, and take top 10
        return Object.keys(counts)
            .map(text => ({ text, value: counts[text] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Extract Top 10 Phrases

    }, [data, query]);

    if (words.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                関連キーワードはありません
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-white p-4 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
                {words.map((item, i) => (
                    <button
                        key={item.text}
                        onClick={() => onKeywordClick?.(item.text)}
                        className="group flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-yellow-50 text-slate-700 hover:text-yellow-700 rounded-full text-sm font-bold transition-all border border-slate-200 hover:border-yellow-200"
                        title={`${item.value}件`}
                    >
                        <Search size={12} className="text-slate-400 group-hover:text-yellow-500" />
                        {item.text}
                    </button>
                ))}
            </div>
        </div>
    );
}
