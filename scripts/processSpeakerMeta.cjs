
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const INPUT_FILE = path.join(__dirname, '../data/giin20251230.csv');
const OUTPUT_FILE = path.join(__dirname, '../public/data/speaker_meta.json');

try {
    const fileContent = fs.readFileSync(INPUT_FILE, 'utf8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        bom: true
    });

    const metaMap = {};
    records.forEach(record => {
        const name = record['氏名'];
        const status = record['現職元職']; // '現職' or '元職'
        const kana = record['ふりがな氏名'];

        if (name) {
            metaMap[name] = {
                status,
                kana
            };
        }
    });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(metaMap, null, 2));
    console.log(`Generated speaker metadata for ${Object.keys(metaMap).length} speakers.`);
    console.log(`Written to: ${OUTPUT_FILE}`);

} catch (err) {
    console.error('Error processing speaker metadata:', err);
    process.exit(1);
}
