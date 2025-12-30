import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFiles = [
    // { path: path.join(__dirname, '../public/data/gijiroku.csv'), encoding: 'Shift_JIS' },
    // { path: path.join(__dirname, '../data/kugikai_data2011-2025mid-FIX.csv'), encoding: 'utf8' },
    // Maintenance CSV
    // Maintenance CSV
    { path: path.join(__dirname, '../data/gijiroku_export_converted.csv'), encoding: 'utf8' }
];
const outputFile = path.join(__dirname, '../public/data/gijiroku.json');

async function processData() {
    try {
        let allRecords = [];

        for (const fileInfo of inputFiles) {
            const inputFile = fileInfo.path;
            if (!fs.existsSync(inputFile)) {
                console.warn(`Warning: File not found: ${inputFile}`);
                continue;
            }

            console.log(`Reading from: ${inputFile} (${fileInfo.encoding})`);
            const buffer = fs.readFileSync(inputFile);

            let decodedContent;
            if (fileInfo.encoding === 'Shift_JIS') {
                decodedContent = iconv.decode(buffer, 'Shift_JIS');
            } else {
                decodedContent = iconv.decode(buffer, 'utf8');
            }

            const records = parse(decodedContent, {
                columns: true,
                skip_empty_lines: true,
                relax_column_count: true,
                bom: true
            });

            console.log(`Parsed ${records.length} records from ${path.basename(inputFile)}`);
            allRecords = allRecords.concat(records);
        }

        console.log(`Total records: ${allRecords.length}`);

        // Optimize / Normalize keys
        const optimizedData = allRecords.map((record, index) => {
            let year = record['年度'] ? parseInt(record['年度'], 10) : null;

            if (!year && record['会議の名称']) {
                const matchHeisei = record['会議の名称'].match(/平成(\d+)年/);
                if (matchHeisei) {
                    year = 1988 + parseInt(matchHeisei[1], 10);
                } else {
                    const matchReiwa = record['会議の名称'].match(/令和(\d+)年/);
                    if (matchReiwa) {
                        year = 2018 + parseInt(matchReiwa[1], 10);
                    } else if (record['会議の名称'].includes('令和元年')) {
                        year = 2019;
                    }
                }
            }

            // Use existing ID if available, otherwise generate
            const id = record['ID'] || `H${(index + 1).toString().padStart(8, '0')}`;

            return {
                id: id,
                title: record['会議の名称'] || '',
                speaker: record['発言者'] || '',
                category: record['人分類'] || 'その他',
                body: record['発言内容'] || '',
                year: year,
                date: record['月日'] || '',
                type: record['委員会/本会議名称'] || record['委員会名称'] || '',
                content_classification: record['内容分類'] || ''
            };
        });

        // Write JSON
        fs.writeFileSync(outputFile, JSON.stringify(optimizedData));
        console.log(`Written to: ${outputFile}`);

        const stats = fs.statSync(outputFile);
        console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    } catch (error) {
        console.error("Error processing data:", error);
        process.exit(1);
    }
}

processData();
