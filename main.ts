// make.fun cutest-picture-01 entry (Node 22, standard library only): its picture is the entry.png beside this file,
// and the program copies it to /output/entry.png. The image is a fluffy cream-white baby kitten with huge glossy
// blue eyes, wearing a mint knitted scarf, a daisy flower crown and a peach bow, gently hugging two tiny sleeping
// yellow chicks. The gate takes a whole PNG or JPEG of at most 1 MiB and 1024 by 1024 pixels, and the judge sees
// exactly the bytes copied.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_BYTES = 1024 * 1024; // 1 MiB gate limit
const MAX_DIMENSION = 1024; // 1024x1024 gate limit

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

// Read and validate the source PNG before copying. The gate rejects anything
// that is not a valid PNG within 1 MiB and 1024x1024, so a bad source should
// fail loudly here instead of silently shipping an entry the judge discards.
const sourcePath = new URL('./entry.png', import.meta.url);
if (!existsSync(sourcePath)) {
  fail(`source entry.png not found at ${sourcePath.pathname}`);
}
const bytes = readFileSync(sourcePath);
if (bytes.length < 33 || !bytes.subarray(0, 8).equals(PNG_MAGIC)) {
  fail('source entry.png is not a PNG (missing PNG magic bytes)');
}
if (bytes.length > MAX_BYTES) {
  fail(`source entry.png is ${bytes.length} bytes, over the 1 MiB gate limit`);
}
// The IHDR chunk follows the 8-byte signature: 4-byte length, 4-byte "IHDR",
// then 4-byte width and 4-byte height, both big-endian.
const ihdrLength = bytes.readUInt32BE(8);
const ihdrType = bytes.toString('ascii', 12, 16);
if (ihdrLength !== 13 || ihdrType !== 'IHDR') {
  fail('source entry.png has no valid IHDR chunk');
}
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
  fail(`source entry.png is ${width}x${height}, over the 1024x1024 gate limit`);
}

// Copy the validated bytes unchanged; the judge sees exactly these bytes.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outputDir, { recursive: true });
const outputPath = join(outputDir, 'entry.png');
copyFileSync(sourcePath, outputPath);

// Verify the output is byte-identical to the validated source.
if (!readFileSync(outputPath).equals(bytes)) {
  fail('output entry.png differs from the validated source');
}
console.log(`wrote ${outputPath} (${width}x${height}, ${bytes.length} bytes)`);
