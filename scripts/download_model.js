import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_ID = "Gemma-2-2b-it-q4f32_1";
const BASE_URL = `https://huggingface.co/mlc-ai/${MODEL_ID}-MLC/resolve/main/`;
const OUTPUT_DIR = path.join(__dirname, '../public/models', MODEL_ID);

console.log(`Model ID: ${MODEL_ID}`);
console.log(`Base URL: ${BASE_URL}`);

// Ensure output dir exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function resolveRedirect(originalUrl, location) {
    return new URL(location, originalUrl).href;
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(dest)) {
            console.log(`  - File exists, skipping: ${path.basename(dest)}`);
            resolve();
            return;
        }
        const file = fs.createWriteStream(dest);
        const req = https.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
                const newUrl = resolveRedirect(url, res.headers.location);
                downloadFile(newUrl, dest).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: StatusCode ${res.statusCode}`));
                return;
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        });
        req.on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

async function main() {
    console.log(`Starting download for ${MODEL_ID}...`);
    console.log(`Target Directory: ${OUTPUT_DIR}`);

    // 1. Download ndarray-cache.json to get file list
    const cacheUrl = BASE_URL + "ndarray-cache.json";
    const cachePath = path.join(OUTPUT_DIR, "ndarray-cache.json");

    console.log("Fetching ndarray-cache.json...");
    try {
        await downloadFile(cacheUrl, cachePath);
    } catch (e) {
        console.error("Failed to fetch ndarray-cache.json. Check network or model name.", e);
        process.exit(1);
    }

    const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    const records = cacheData.records || [];

    // 2. Download mlc-chat-config.json and tokenizers
    console.log("Downloading config files...");
    const configFiles = ["mlc-chat-config.json", "tokenizer.json", "tokenizer_config.json"];
    for (const file of configFiles) {
        console.log(`Downloading ${file}...`);
        try {
            await downloadFile(BASE_URL + file, path.join(OUTPUT_DIR, file));
        } catch (e) {
            console.warn(`Warning: Failed to download ${file}. It might not exist or be needed.`, e.message);
        }
    }

    // 3. Download Model Weights
    console.log(`Found ${records.length} weight files to download.`);

    // Debug first record type
    if (records.length > 0) {
        console.log("Sample record:", records[0]);
    }

    for (const record of records) {
        let fileName;
        if (typeof record === 'string') {
            fileName = record;
        } else {
            fileName = record.name || record.dataPath;
        }

        if (!fileName) {
            console.warn("Skipping INVALID record:", record);
            continue;
        }

        const fileUrl = BASE_URL + fileName;
        const filePath = path.join(OUTPUT_DIR, fileName);

        console.log(`Downloading ${fileName}...`);
        await downloadFile(fileUrl, filePath);
    }

    console.log("All files downloaded successfully!");
}

main();
