const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '../sabun20260220-2.csv');
const OUTPUT_FILE = path.join(__dirname, '../data/sabun_enriched.csv');

function normalizeDate(dateStr) {
    if (!dateStr) return '';
    // Handle YYYYMMDD
    if (/^\d{8}$/.test(dateStr)) {
        return `${dateStr.substring(0, 4)}/${dateStr.substring(4, 6)}/${dateStr.substring(6, 8)}`;
    }
    // Handle YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr.replace(/-/g, '/');
    }
    return dateStr;
}

function calculateNendo(dateStr) {
    if (!dateStr) return '';
    // Expecting YYYY/MM/DD
    const parts = dateStr.split('/');
    if (parts.length !== 3) return '';

    let year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);

    if (month < 4) {
        year -= 1;
    }
    return year.toString();
}

try {
    console.log(`Reading from ${INPUT_FILE}...`);
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`Input file not found: ${INPUT_FILE}`);
        process.exit(1);
    }

    const inputContent = fs.readFileSync(INPUT_FILE, 'utf8');
    const records = parse(inputContent, {
        columns: true,
        skip_empty_lines: true,
        bom: true
    });

    console.log(`Parsed ${records.length} records.`);

    const enrichedRecords = records.map(record => {
        let dateStr = record['年月日'] || '';
        dateStr = normalizeDate(dateStr); // Normalize validation
        const nendo = calculateNendo(dateStr);

        // Extract Committee/Plenary from title if possible, or leave empty
        // Simple heuristic: if title contains 委員会, use that.
        let type = '';
        if (record['会議の名称'] && record['会議の名称'].includes('委員会')) {
            // specific logic could be added here, for now leave empty/manual or copy title?
            // sabun20260201.csv had '委員会/本会議名称'.
            // For now, let's leave it blank or default.
        }

        return {
            '会議の名称': record['会議の名称'] || '',
            '発言者': record['発言者'] || '',
            '人分類': record['人分類'] || '',
            '発言内容': record['発言内容'] || '',
            '年度': nendo,
            '月日': dateStr,
            'ID': '', // Leave empty for merge_sabun.py to generate
            '委員会/本会議名称': type,
            '内容分類': '',
            'is_unofficial': '0' // Mark as official
        };
    });

    const outputContent = stringify(enrichedRecords, {
        header: true,
        columns: [
            '会議の名称', '発言者', '人分類', '発言内容', '年度', '月日', 'ID', '委員会/本会議名称', '内容分類', 'is_unofficial'
        ]
    });

    // Ensure output dir exists
    const outDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, outputContent);
    console.log(`Successfully processed ${records.length} records to ${OUTPUT_FILE}`);

} catch (err) {
    console.error('Error processing file:', err);
    process.exit(1);
}
