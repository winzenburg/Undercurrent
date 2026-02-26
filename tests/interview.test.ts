import { describe, it, expect } from "vitest";
import { QUESTIONS, SECTIONS, ODYSSEY_PATHS, ODYSSEY_DIMENSIONS, CAREER_CANVAS_BLOCKS, FRAMEWORK_COLORS } from "../constants/interview-data";
import { CURATED_VOICES } from "../lib/voice-store";

// ─── Interview Data ────────────────────────────────────────────────────────────

describe("Interview Data", () => {
  it("has 8 sections", () => {
    expect(SECTIONS).toHaveLength(8);
  });

  it("has 19 questions total", () => {
    expect(QUESTIONS).toHaveLength(19);
  });

  it("every question has a non-empty question text", () => {
    QUESTIONS.forEach((q) => {
      expect(q.question.length).toBeGreaterThan(10);
    });
  });

  it("every question belongs to a valid section", () => {
    const sectionIds = new Set(SECTIONS.map((s) => s.id));
    QUESTIONS.forEach((q) => {
      expect(sectionIds.has(q.sectionId)).toBe(true);
    });
  });

  it("every question has at least one framework tag", () => {
    QUESTIONS.forEach((q) => {
      expect(q.frameworks.length).toBeGreaterThan(0);
    });
  });

  it("has 3 odyssey paths", () => {
    expect(ODYSSEY_PATHS).toHaveLength(3);
    const ids = ODYSSEY_PATHS.map((p) => p.id);
    expect(ids).toContain("path_a");
    expect(ids).toContain("path_b");
    expect(ids).toContain("path_c");
  });

  it("has 4 odyssey dimensions", () => {
    expect(ODYSSEY_DIMENSIONS).toHaveLength(4);
  });

  it("has 8 career canvas blocks", () => {
    expect(CAREER_CANVAS_BLOCKS).toHaveLength(8);
  });

  it("has 6 framework colors", () => {
    expect(Object.keys(FRAMEWORK_COLORS)).toHaveLength(6);
  });

  it("main interview questions (excluding odyssey rating) are 18", () => {
    const mainQuestions = QUESTIONS.filter((q) => !q.isOdysseyRating);
    expect(mainQuestions).toHaveLength(18);
  });
});

// ─── Voice Store ───────────────────────────────────────────────────────────────

describe("Voice Store", () => {
  it("has exactly 5 curated voices", () => {
    expect(CURATED_VOICES).toHaveLength(5);
  });

  it("all voices have required fields", () => {
    CURATED_VOICES.forEach((v) => {
      expect(v.voice_id).toBeTruthy();
      expect(v.name).toBeTruthy();
      expect(v.description).toBeTruthy();
    });
  });

  it("Rachel is the first (default) voice", () => {
    expect(CURATED_VOICES[0].name).toBe("Rachel");
    expect(CURATED_VOICES[0].voice_id).toBe("21m00Tcm4TlvDq8ikWAM");
  });
});

// ─── Server Routes (live API) ──────────────────────────────────────────────────

describe("ElevenLabs TTS (live)", () => {
  it("synthesizes speech and returns base64 audio", async () => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    expect(apiKey, "ELEVENLABS_API_KEY must be set").toBeTruthy();

    const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey!,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: "Hello, I'm your career discovery coach.",
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.45, similarity_boost: 0.82 },
      }),
    });

    expect(res.ok, `ElevenLabs returned ${res.status}`).toBe(true);
    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(1000);
  }, 15000);
});

describe("Resend Email API (live)", () => {
  it("accepts a valid API key and can list domains", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey, "RESEND_API_KEY must be set").toBeTruthy();

    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    expect(res.ok, `Resend returned ${res.status}`).toBe(true);
  }, 10000);
});
