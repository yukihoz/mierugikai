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
    { path: path.join(__dirname, '../data/combined_master_20260131.csv'), encoding: 'utf8' },
    { path: path.join(__dirname, '../data/sabun20260222.csv'), encoding: 'utf8' }
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

            // Fix Date format if it's Excel serial number
            let dateStr = record['月日'] || '';
            if (dateStr && !isNaN(dateStr) && !dateStr.includes('/')) {
                const serial = parseFloat(dateStr);
                // Excel base date: Dec 30, 1899 (mostly)
                const utc_days = Math.floor(serial - 25569);
                const utc_value = utc_days * 86400;
                const date_info = new Date(utc_value * 1000);

                // However, simpler approach for local date (Japan is +9, but serial is usually days since 1900-01-01)
                // Mac Excel 1904 date system vs 1900.
                // Standard cheat: serial - 25569 is incorrect for local usage if not careful with timezone.
                // Better: (serial - 1) * 86400 * 1000 + Date.UTC(1900, 0, 1) ?
                // Actually 25569 is offset to 1970-01-01.
                // Let's use a simpler known formula for 1900 system.
                const dateObj = new Date((serial - 25569) * 86400 * 1000);
                // Adjust for timezone offset if necessary, but usually just extracting UTC parts works if we treat it as UTC.
                // Add 1 day if it's off? verify 45841 -> 2025/7/3
                // 45841 - 25569 = 20272 days. 20272 / 365.25 = 55.5 years. 1970 + 55 = 2025. correct.
                const y = dateObj.getUTCFullYear();
                const m = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
                const d = dateObj.getUTCDate().toString().padStart(2, '0');
                dateStr = `${y}/${m}/${d}`;
            }

            // Use existing ID if available, otherwise generate
            const id = record['ID'] || `H${(index + 1).toString().padStart(8, '0')}`;

            // Format the body text: Replace single newlines with double newlines
            let rawBody = record['発言内容'] || '';
            let formattedBody = '';
            if (rawBody) {
                const normalized = rawBody.replace(/\r\n/g, '\n');
                formattedBody = normalized.replace(/\n+/g, '\n\n');
            }

            return {
                id: id,
                title: record['会議の名称'] || '',
                speaker: record['発言者'] || '',
                category: record['人分類'] || 'その他',
                body: formattedBody,
                year: year,
                date: dateStr,
                type: record['委員会/本会議名称'] || record['委員会名称'] || '',
                content_classification: record['内容分類'] || '',
                is_unofficial: record['is_unofficial'] === '1' || record['is_unofficial'] === 'true'
            };
        });

        // Sort by date descending (newest first)
        optimizedData.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (isNaN(dateA) && isNaN(dateB)) return 0;
            if (isNaN(dateA)) return 1;
            if (isNaN(dateB)) return -1;
            return dateB - dateA;
        });

        // Write Preview JSON (includes unofficial data)
        const previewFile = path.join(__dirname, '../public/data/gijiroku_preview.json');
        fs.writeFileSync(previewFile, JSON.stringify(optimizedData));
        console.log(`Written to: ${previewFile}`);

        // Write Public JSON (excludes unofficial data)
        const publicData = optimizedData.filter(d => !d.is_unofficial);
        fs.writeFileSync(outputFile, JSON.stringify(publicData));
        console.log(`Written to: ${outputFile} (Public, excluded unofficial)`);

        console.log(`Size preview: ${(fs.statSync(previewFile).size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Size public: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);

    } catch (error) {
        console.error("Error processing data:", error);
        process.exit(1);
    }
}

processData();
