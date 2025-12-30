export const loadData = async (url) => {
    // Special handling for gijiroku data to support split files
    if (url.includes('gijiroku')) {
        try {
            const timestamp = new Date().getTime();
            const fetchPart = async (index) => {
                // Handle both .csv and .json extensions in input url
                const partName = `gijiroku_part_${index}.json`;
                const partUrl = url.replace('gijiroku.csv', partName).replace('gijiroku.json', partName);

                const response = await fetch(`${partUrl}?v=${timestamp}`);
                if (!response.ok) return null;
                return response.json();
            };

            // Fetch up to 8 parts in parallel (expecting parts 0, 1, 2, 3...)
            const promises = Array.from({ length: 8 }, (_, i) => fetchPart(i));
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
