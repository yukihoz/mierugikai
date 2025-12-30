export const HighlightedText = ({ text, highlight }) => {
    if (!text) return null;
    if (!highlight) return <>{text}</>;

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
        const parts = text.split(regex);

        return (
            <span>
                {parts.map((part, i) =>
                    (i % 2 === 1) ? (
                        <span key={i} className="bg-yellow-200 text-slate-900 font-medium px-1 rounded">{part}</span>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    } catch (e) {
        // Fallback if regex fails
        return <>{text}</>;
    }
};
