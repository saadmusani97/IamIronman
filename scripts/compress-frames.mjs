import sharp from "sharp";
import { readdirSync, statSync } from "fs";
import { join } from "path";

const QUALITY = 75;
const DIRS = ["public/frames", "public/frames2"];

let totalBefore = 0;
let totalAfter = 0;
let count = 0;

for (const dir of DIRS) {
  const files = readdirSync(dir).filter((f) => f.endsWith(".jpg"));
  console.log(`\nCompressing ${files.length} files in ${dir}...`);

  for (const file of files) {
    const filePath = join(dir, file);
    const before = statSync(filePath).size;
    totalBefore += before;

    // Overwrite in place with compressed JPEG at 75% quality
    const compressed = await sharp(filePath)
      .jpeg({ quality: QUALITY, progressive: true, mozjpeg: true })
      .toBuffer();

    await sharp(compressed).toFile(filePath);
    totalAfter += compressed.length;
    count++;

    if (count % 50 === 0) {
      process.stdout.write(`  ${count} done...\r`);
    }
  }
}

const saved = ((1 - totalAfter / totalBefore) * 100).toFixed(1);
console.log(`\n✓ Compressed ${count} frames`);
console.log(`  Before: ${(totalBefore / 1024 / 1024).toFixed(1)} MB`);
console.log(`  After:  ${(totalAfter / 1024 / 1024).toFixed(1)} MB`);
console.log(`  Saved:  ${saved}%`);
