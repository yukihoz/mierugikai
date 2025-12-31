const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../public/data/gijiroku.json');
const outputDir = path.join(__dirname, '../public/data/');
const CHUNK_SIZE = 10000; // Cloudflare limit is 25MB. 10k is approx 15MB.

try {
    console.log(`Reading ${inputFile}...`);
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    console.log(`Total records: ${data.length}`);

    const totalChunks = Math.ceil(data.length / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = start + CHUNK_SIZE;
        const chunk = data.slice(start, end);
        const outputFilename = path.join(outputDir, `gijiroku_part_${i}.json`);

        fs.writeFileSync(outputFilename, JSON.stringify(chunk));
        console.log(`Written chunk ${i} (${chunk.length} records) to ${outputFilename}`);

        const stats = fs.statSync(outputFilename);
        console.log(`Example Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    }

    console.log('Splitting complete.');

} catch (e) {
    console.error('Error splitting data:', e);
    process.exit(1);
}
