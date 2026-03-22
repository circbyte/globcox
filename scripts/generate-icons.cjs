const { createCanvas } = require('canvas');
const fs = require('fs');

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#4f46e5';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size / 4);
  ctx.fill();

  // Foreground (simple triangle/play shape or similar)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(size / 2, size / 4);
  ctx.lineTo(size * 3 / 4, size * 3 / 4);
  ctx.lineTo(size / 4, size * 3 / 4);
  ctx.fill();

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/icon-${size}.png`, buffer);
  console.log(`Created icon-${size}.png`);
}

createIcon(192);
createIcon(512);
