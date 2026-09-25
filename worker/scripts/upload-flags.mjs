/**
 * Upload SVG flag placeholders to R2 for demo countries.
 *
 * Usage (from worker/):
 *   npx wrangler r2 bucket create se-country-flags
 *   npm run upload-flags
 */

import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const BUCKET = "se-country-flags";
const COUNTRIES = [
  { code: "US", colors: ["#3c3b6e", "#ffffff", "#b22234"] },
  { code: "GB", colors: ["#012169", "#ffffff", "#c8102e"] },
  { code: "DE", colors: ["#000000", "#dd0000", "#ffce00"] },
  { code: "FR", colors: ["#0055a4", "#ffffff", "#ef4135"] },
  { code: "XX", colors: ["#94a3b8", "#e2e8f0", "#64748b"] },
];

const tmp = join(process.cwd(), ".tmp-flags");
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

for (const { code, colors } of COUNTRIES) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
  <rect width="106.67" height="200" fill="${colors[0]}"/>
  <rect x="106.67" width="106.66" height="200" fill="${colors[1]}"/>
  <rect x="213.33" width="106.67" height="200" fill="${colors[2]}"/>
  <text x="160" y="110" text-anchor="middle" font-family="system-ui,sans-serif" font-size="28" fill="#111">${code}</text>
</svg>`;
  const file = join(tmp, `${code}.svg`);
  writeFileSync(file, svg);
  execSync(`npx wrangler r2 object put ${BUCKET}/${code}.svg --file=${file}`, {
    stdio: "inherit",
  });
}

rmSync(tmp, { recursive: true, force: true });
console.log("Uploaded flag objects to R2.");
