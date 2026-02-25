import { useMemo } from 'react';

// Escape regex characters
const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Create a pattern that matches both half-width and full-width for each character
const createFlexiblePattern = (input) => {
    return input.split('').map(char => {
        const code = char.charCodeAt(0);

        // Half-width to Full-width (ASCII range: ! to ~)
        if (code >= 33 && code <= 126) {
            const full = String.fromCharCode(code + 0xFEE0);
            return `[${escapeRegExp(char)}${full}]`;
        }
        // Full-width to Half-width (！ to ～)
        if (code >= 0xFF01 && code <= 0xFF5E) {
            const half = String.fromCharCode(code - 0xFEE0);
            return `[${escapeRegExp(half)}${char}]`;
        }
        // Handle Space (Half: 32, Full: 12288)
        if (code === 32 || code === 12288) {
            return '[ \u3000]';
        }

        return escapeRegExp(char);
    }).join('');
};

export const HighlightedText = ({ text, highlight, truncate = false }) => {
    if (!text || typeof text !== 'string') return null;

    if (!highlight && !truncate) return <>{text}</>;
    if (!highlight && truncate) {
        // No highlight, just truncate
        const maxLength = 200;
        if (text.length <= maxLength) return <>{text}</>;
        return <>{text.slice(0, maxLength)}...</>;
    }

    const regex = useMemo(() => {
        try {
            if (!highlight) return null;
            const pattern = createFlexiblePattern(highlight);
            return new RegExp(`(${pattern})`, 'gi');
        } catch (e) {
            return null;
        }
    }, [highlight]);

    if (!regex) {
        return <>{truncate ? text.slice(0, 200) + (text.length > 200 ? '...' : '') : text}</>;
    }

    let displayText = text;
    let prefix = '';
    let suffix = '';

    if (truncate) {
        const match = regex.exec(text);
        if (match) {
            const matchIndex = match.index;
            // Keep 200 chars before and after
            const start = Math.max(0, matchIndex - 200);
            const end = Math.min(text.length, matchIndex + match[0].length + 200);

            displayText = text.slice(start, end);
            if (start > 0) prefix = '...';
            if (end < text.length) suffix = '...';
        } else {
            // Match not found in text (e.g. metadata match), show start
            const maxLength = 200;
            if (text.length > maxLength) {
                displayText = text.slice(0, maxLength);
                suffix = '...';
            }
        }

        regex.lastIndex = 0; // reset
    }

    // Split preserves the capturing group matches in the array
    const parts = displayText.split(regex);

    return (
        <span>
            {prefix}
            {parts.map((part, i) =>
                (i % 2 === 1) ? (
                    <span key={i} className="bg-yellow-200 text-slate-900 font-medium px-1 rounded">{part}</span>
                ) : (
                    part
                )
            )}
            {suffix}
        </span>
    );
};
