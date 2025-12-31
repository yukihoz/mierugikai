
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { stringify } = require('csv-stringify/sync');

const INPUT_FILE = path.join(__dirname, '../data/gijiroku_export_utf820251229-2.xlsx');
const OUTPUT_FILE = path.join(__dirname, '../data/gijiroku_export_converted.csv');

try {
    console.log(`Reading Excel file: ${INPUT_FILE}`);
    if (!fs.existsSync(INPUT_FILE)) {
        console.error('Input file not found!');
        process.exit(1);
    }

    const workbook = XLSX.readFile(INPUT_FILE);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    console.log(`Sheet Name: ${firstSheetName}`);

    // Convert to JSON first to handle headers and data cleanly
    // defval: '' satisfies the "fill empty cells" need? Or let's handle specifically.
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '', cellDates: true });

    console.log(`Rows found: ${jsonData.length}`);

    // Check for target ID content
    const targetId = 'H00152025';
    const targetRow = jsonData.find(r => r.ID === targetId);
    if (targetRow) {
        console.log(`Content for ${targetId}: ${String(targetRow['発言内容']).substring(0, 50)}...`);
    } else {
        console.log(`Warning: ID ${targetId} not found in Excel data.`);
    }

    // Convert JSON to CSV with BOM and UTF-8
    // Extract headers from first row keys or scan all? sheet_to_json usually gives keys.
    // Ensure all keys are captured? 
    // Usually sheet_to_json gets headers from the first row.

    if (jsonData.length > 0) {
        // Re-stringify to CSV to control format (UTF-8 BOM, quoting, etc.)
        const output = stringify(jsonData, {
            header: true,
            bom: true,
            quoted: false // Quote minimized? Or quoted: true for safety? user suspected truncation.
            // Maybe Excel export cut it off? If so, reading excel directly should get full text.
            // CSV stringify handles long text fine.
        });

        fs.writeFileSync(OUTPUT_FILE, output);
        console.log(`Exported CSV to: ${OUTPUT_FILE}`);
    }

} catch (err) {
    console.error('Conversion Failed:', err);
    process.exit(1);
}
