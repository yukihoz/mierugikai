// Helper to unpack compact tuple format into objects
const unpackData = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw; // Already object array
    if (raw.fields && Array.isArray(raw.rows)) {
        const fields = raw.fields;
        return raw.rows.map(row => {
            const obj = {};
            for (let i = 0; i < fields.length; i++) {
                obj[fields[i]] = row[i];
            }
            return obj;
        });
    }
    return [];
};

export const loadData = async (url, onProgress = () => { }, onInitialData = null) => {
    // Special handling for gijiroku data to support split files
    if (url.includes('gijiroku')) {
        try {
            const timestamp = new Date().getTime();
            let completed = 0;
            const totalParts = 18;
            const initialParts = 2; // Immediate paint for the most recent 2-3 years

            const fetchPart = async (index, isInitialPhase) => {
                try {
                    // Determine whether it's a preview or public chunk
                    const isPreview = url.includes('preview');
                    const partName = isPreview ? `gijiroku_preview_part_${index}.json` : `gijiroku_part_${index}.json`;
                    const partUrl = url.replace(/gijiroku[^/]*\.(json|csv)/, partName) + `?v=${timestamp}`;

                    // Add cache buster to bypass aggressive browser caching during dev
                    const response = await fetch(partUrl, {
                        priority: isInitialPhase ? 'high' : 'low',
                        cache: 'no-cache'
                    });
                    if (!response.ok) return null;
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.includes("text/html")) return null;
                    const json = await response.json();
                    return unpackData(json);
                } finally {
                    completed++;
                    if (completed <= initialParts) {
                        onProgress(Math.round((completed / initialParts) * 100));
                    }
                }
            };

            // Phase 1: Initial Load (chunks 0-1)
            const initialPromises = Array.from({ length: initialParts }, (_, i) => fetchPart(i, true));
            const initialResults = await Promise.all(initialPromises);
            const initialRecords = initialResults.filter(r => r !== null).flat();

            if (onInitialData && initialRecords.length > 0) {
                onInitialData(initialRecords);
            }

            // Phase 2: Background Load (remaining chunks)
            const remainingPromises = Array.from({ length: totalParts - initialParts }, (_, i) => fetchPart(i + initialParts, false));
            const remainingResults = await Promise.all(remainingPromises);
            const remainingRecords = remainingResults.filter(r => r !== null).flat();

            const allRecords = [...initialRecords, ...remainingRecords];

            if (allRecords.length > 0) {
                return allRecords;
            }
            // If no parts found, fall through to single file load
        } catch (e) {
            console.warn("Split data load failed, trying single file...", e);
        }
    }

    // Standard Loading (Single File)
    const jsonUrl = url.endsWith('.json') ? url : url.replace('.csv', '.json');

    try {
        const response = await fetch(jsonUrl, { priority: 'high' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return unpackData(data);

    } catch (error) {
        console.error("Data load error", error);
        throw error;
    }
};
