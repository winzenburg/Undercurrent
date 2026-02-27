import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env manually
try {
  const env = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of env.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const k = trimmed.substring(0, idx);
    const v = trimmed.substring(idx + 1).replace(/^["']|["']$/g, "");
    process.env[k] = v;
  }
} catch {}

const key = process.env.ELEVENLABS_API_KEY;
console.log("Key prefix:", key ? key.substring(0, 12) + "..." : "NOT FOUND");

// Test TTS directly
const RACHEL_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";
const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${RACHEL_VOICE_ID}`, {
  method: "POST",
  headers: {
    "xi-api-key": key,
    "Content-Type": "application/json",
    Accept: "audio/mpeg",
  },
  body: JSON.stringify({
    text: "Hello, this is a test.",
    model_id: "eleven_turbo_v2_5",
    voice_settings: { stability: 0.5, similarity_boost: 0.8 },
  }),
});

console.log("TTS status:", res.status);
if (res.ok) {
  const buf = await res.arrayBuffer();
  console.log("SUCCESS — audio bytes:", buf.byteLength);
  console.log("This key CAN generate speech.");
} else {
  const err = await res.text();
  console.log("FAILED — error:", err);
}
