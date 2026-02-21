const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../public/data/');
const CHUNK_SIZE = 10000; // Cloudflare limit is 25MB. 10k is approx 15MB.

function splitFile(inputName, prefix) {
    const inputFile = path.join(outputDir, inputName);

    try {
        if (!fs.existsSync(inputFile)) {
            console.log(`Skipping ${inputFile} as it does not exist.`);
            return;
        }

        console.log(`--- Splitting ${inputName} ---`);
        const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
        console.log(`Total records: ${data.length}`);

        const totalChunks = Math.ceil(data.length / CHUNK_SIZE);

        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = start + CHUNK_SIZE;
            const chunk = data.slice(start, end);
            const outputFilename = path.join(outputDir, `${prefix}_part_${i}.json`);

            fs.writeFileSync(outputFilename, JSON.stringify(chunk));
            console.log(`Written chunk ${i} (${chunk.length} records) to ${outputFilename}`);
        }

        console.log(`Splitting complete for ${inputName}.\n`);

    } catch (e) {
        console.error(`Error splitting data for ${inputName}:`, e);
        process.exit(1);
    }
}

splitFile('gijiroku.json', 'gijiroku');
splitFile('gijiroku_preview.json', 'gijiroku_preview');
