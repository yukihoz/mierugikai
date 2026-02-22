const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

async function processFavicon() {
    const srcPath = path.join(__dirname, '../public/images/gijie_hirogeru.png');
    const outPath = path.join(__dirname, '../public/favicon.png');

    const img = await loadImage(srcPath);
    // Make it a square canvas to ensure it doesn't stretch when used as a favicon
    const size = Math.max(img.width, img.height);
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    const dx = (size - img.width) / 2;
    const dy = (size - img.height) / 2;
    ctx.drawImage(img, dx, dy);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outPath, buffer);
    console.log('Saved public/favicon.png successfully.');
}

processFavicon().catch(console.error);
