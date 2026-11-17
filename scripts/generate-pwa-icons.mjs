import { mkdir } from "node:fs/promises";
import sharp from "sharp";

await mkdir("public/icons", { recursive: true });

function svg(size) {
  const rx = Math.round(size * 0.2);
  const r = size * 0.33;
  const stroke = Math.max(4, Math.round(size / 32));
  const inner = size * 0.12;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="${size}" y2="${size}" gradientUnits="userSpaceOnUse">
      <stop stop-color="#146448"/>
      <stop offset="1" stop-color="#0C3B2E"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${rx}" fill="url(#g)"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="#F4F1E6" stroke="#E2B34A" stroke-width="${stroke}"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${inner}" fill="#10231C"/>
</svg>`;
}

for (const size of [192, 512]) {
  await sharp(Buffer.from(svg(size)))
    .png()
    .toFile(`public/icons/icon-${size}.png`);
}
await sharp(Buffer.from(svg(512)))
  .png()
  .toFile("public/icons/icon-maskable-512.png");

console.log("PWA icons written to public/icons");
