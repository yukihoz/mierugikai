import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { stringify } from 'csv-stringify/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_JSON = path.join(__dirname, '../public/data/gijiroku.json');
const OUTPUT_CSV = path.join(__dirname, '../data/gijiroku_export_utf8.csv');

console.log(`Reading JSON from: ${INPUT_JSON}`);

try {
    const rawData = fs.readFileSync(INPUT_JSON, 'utf8');
    const data = JSON.parse(rawData);

    // Map JSON keys back to Japanese CSV headers
    const csvData = data.map(item => ({
        'ID': item.id,
        '会議の名称': item.title,
        '発言者': item.speaker,
        '人分類': item.category,
        '発言内容': item.body,
        '年度': item.year,
        '月日': item.date,
        '委員会/本会議名称': item.type,
        '内容分類': item.content_classification || ''
    }));

    // Generate CSV with BOM for Excel compatibility (UTF-8)
    const output = stringify(csvData, {
        header: true,
        bom: true // Important for Excel to recognize UTF-8
    });

    fs.writeFileSync(OUTPUT_CSV, output);
    console.log(`Exported ${csvData.length} records to: ${OUTPUT_CSV}`);

    const stats = fs.statSync(OUTPUT_CSV);
    console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

} catch (error) {
    console.error("Error exporting CSV:", error);
    process.exit(1);
}
