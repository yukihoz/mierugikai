export const HighlightedText = ({ text, highlight, truncate = false }) => {
    if (!text) return null;
    if (!highlight && !truncate) return <>{text}</>;
    if (!highlight && truncate) {
        // No highlight, just truncate
        const maxLength = 200;
        if (text.length <= maxLength) return <>{text}</>;
        return <>{text.slice(0, maxLength)}...</>;
    }

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
                return '[ \\u3000]';
            }
            return escapeRegExp(char);
        }).join('');
    };

    try {
        const pattern = createFlexiblePattern(highlight);
        const regex = new RegExp(`(${pattern})`, 'gi');

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
        }

        // Re-run regex on the sliced text for highlighting
        // We need to reset regex lastIndex or create new one if stateful, but 'gi' without exec loop is stateless enough for split usually?
        // Actually split works fine.
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
    } catch (e) {
        // Fallback if regex fails
        return <>{truncate ? text.slice(0, 200) + '...' : text}</>;
    }
};
