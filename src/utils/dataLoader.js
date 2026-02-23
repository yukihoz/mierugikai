export const loadData = async (url, onProgress = () => { }) => {
    // Special handling for gijiroku data to support split files
    if (url.includes('gijiroku')) {
        try {
            const timestamp = new Date().getTime();
            let completed = 0;
            const totalParts = 20;

            const fetchPart = async (index) => {
                try {
                    // Determine whether it's a preview or public chunk
                    const isPreview = url.includes('preview');
                    const partName = isPreview ? `gijiroku_preview_part_${index}.json` : `gijiroku_part_${index}.json`;
                    const partUrl = url.replace(/gijiroku[^/]*\.(json|csv)/, partName);

                    const response = await fetch(`${partUrl}?v=${timestamp}`);
                    if (!response.ok) return null;
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.includes("text/html")) return null;
                    return await response.json();
                } finally {
                    completed++;
                    onProgress(Math.round((completed / totalParts) * 100));
                }
            };

            // Fetch up to 20 parts in parallel (expecting parts 0 to ~15)
            const promises = Array.from({ length: totalParts }, (_, i) => fetchPart(i));
            const results = await Promise.all(promises);

            const allRecords = results.filter(r => r !== null).flat();

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
        const response = await fetch(`${jsonUrl}?v=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Data load error", error);
        throw error;
    }
};
