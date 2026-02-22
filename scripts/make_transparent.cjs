const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const SRC_DIR = path.join(__dirname, '../public/images');

async function processImages() {
    const files = fs.readdirSync(SRC_DIR).filter(f => f.startsWith('gijie_') && f.endsWith('.png'));

    for (const file of files) {
        const filePath = path.join(SRC_DIR, file);
        console.log(`Processing ${file}...`);

        const image = await loadImage(filePath);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Make white/near-white pixels transparent
        // A simple tolerance check for white (r > 240, g > 240, b > 240)
        let removedCount = 0;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            if (r > 240 && g > 240 && b > 240) {
                data[i + 3] = 0; // Set alpha to 0 (transparent)
                removedCount++;
            }
        }

        ctx.putImageData(imageData, 0, 0);

        console.log(`   Removed ${removedCount} white/near-white pixels.`);

        // Overwrite the original
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(filePath, buffer);
        console.log(`   Saved ${file} with transparency.`);
    }
}

processImages().catch(err => {
    console.error(err);
    process.exit(1);
});
