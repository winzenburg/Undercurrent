import { describe, it, expect } from "vitest";

describe("API Key Validation", () => {
  it("RESEND_API_KEY is set and valid", async () => {
    const key = process.env.RESEND_API_KEY;
    expect(key, "RESEND_API_KEY must be set").toBeTruthy();
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });
    expect(res.status, `Resend API returned ${res.status}`).toBeLessThan(401);
  }, 15000);

  it("ELEVENLABS_API_KEY is set and valid", async () => {
    const key = process.env.ELEVENLABS_API_KEY;
    expect(key, "ELEVENLABS_API_KEY must be set").toBeTruthy();
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": key! },
    });
    expect(res.status, `ElevenLabs API returned ${res.status}`).toBe(200);
  }, 15000);
});
