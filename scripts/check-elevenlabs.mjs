import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env manually
try {
  const env = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of env.split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.+)$/);
    if (match) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {}

const key = process.env.ELEVENLABS_API_KEY;
if (!key) { console.log("No ELEVENLABS_API_KEY found"); process.exit(1); }

console.log("Key prefix:", key.substring(0, 8) + "...");

const res = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
  headers: { "xi-api-key": key }
});
const data = await res.json();
console.log("Status code:", res.status);
console.log("Tier:", data.tier);
console.log("Character count used:", data.character_count);
console.log("Character limit:", data.character_limit);
if (data.character_limit) {
  console.log("Credits remaining:", data.character_limit - data.character_count);
}
if (data.status) console.log("Status:", data.status);
