import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { transcribeAudio } from "./_core/voiceTranscription";
import type { WhisperResponse } from "./_core/voiceTranscription";
import { storagePut } from "./storage";
import * as db from "./db";
import { QUESTIONS, SECTIONS } from "../constants/interview-data";

// ─── Email helper ─────────────────────────────────────────────────────────────

async function sendReportEmail(params: {
  toEmail: string;
  toName: string;
  reportHtml: string;
  reportText: string;
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set, skipping email send");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Career Discovery <noreply@resend.dev>",
        to: [params.toEmail],
        subject: `${params.toName ? params.toName + "'s" : "Your"} Career Discovery Report`,
        html: params.reportHtml,
        text: params.reportText,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[Email] Resend error:", err);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[Email] Failed to send:", e);
    return false;
  }
}

// ─── AI helpers ───────────────────────────────────────────────────────────────

function buildAnswerContext(answers: Array<{ questionId: number; answer: string }>) {
  if (answers.length === 0) return "";
  const lines = answers.map((a) => {
    const q = QUESTIONS.find((q) => q.id === a.questionId);
    return q ? `Q${q.id} (${q.frameworks.join(", ")}): "${a.answer}"` : `Q${a.questionId}: "${a.answer}"`;
  });
  return `\n\nPrevious answers for context:\n${lines.join("\n")}`;
}

// ─── ElevenLabs TTS helper ────────────────────────────────────────────────────

async function synthesizeSpeech(text: string, voiceIdOverride?: string): Promise<Buffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.warn("[TTS] ELEVENLABS_API_KEY not set");
    return null;
  }
  // Use provided voiceId, env override, or default to Rachel
  const voiceId = voiceIdOverride ?? process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.82,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[TTS] ElevenLabs error:", err);
      return null;
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (e) {
    console.error("[TTS] Failed:", e);
    return null;
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Interview Session ──────────────────────────────────────────────────────
  interview: router({
    getSession: protectedProcedure.query(async ({ ctx }) => {
      const session = await db.getOrCreateSession(ctx.user.id);
      const answers = await db.getAnswersBySession(session.id);
      return { session, answers };
    }),

    saveAnswer: protectedProcedure
      .input(z.object({
        questionId: z.number(),
        answer: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getOrCreateSession(ctx.user.id);
        await db.upsertAnswer({
          sessionId: session.id,
          userId: ctx.user.id,
          questionId: input.questionId,
          answer: input.answer,
        });
        return { success: true };
      }),

    updateProgress: protectedProcedure
      .input(z.object({
        currentQuestionId: z.number().optional(),
        completedSections: z.array(z.number()).optional(),
        odysseyPaths: z.object({ path_a: z.string(), path_b: z.string(), path_c: z.string() }).optional(),
        odysseyRatings: z.record(z.string(), z.record(z.string(), z.number())).optional(),
        careerCanvas: z.record(z.string(), z.string()).optional(),
        nextSteps: z.array(z.object({ action: z.string(), deadline: z.string() })).optional(),
        isComplete: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.getOrCreateSession(ctx.user.id);
        // Cast to satisfy drizzle's json column type
        await db.updateSession(ctx.user.id, input as Parameters<typeof db.updateSession>[1]);
        return { success: true };
      }),

    // AI coaching response after each answer — returns text + optional audio base64
    getAiResponse: protectedProcedure
      .input(z.object({
        questionId: z.number(),
        answer: z.string(),
        previousAnswers: z.array(z.object({ questionId: z.number(), answer: z.string() })).optional(),
        withAudio: z.boolean().default(true),
        voiceId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const question = QUESTIONS.find((q) => q.id === input.questionId);
        if (!question) throw new Error("Question not found");
        const section = SECTIONS.find((s) => s.id === question.sectionId);
        const context = buildAnswerContext(input.previousAnswers ?? []);

        const messages: Message[] = [
          {
            role: "system",
            content: `You are a warm, insightful career coach conducting a structured career discovery interview. 
You are using six frameworks: Hedgehog Concept, Ikigai, Design Your Life, Zone of Genius, CliftonStrengths, and Career Canvas.

Your role right now:
- Acknowledge the user's answer warmly and specifically (reference what they actually said)
- Reflect back any patterns or insights you notice
- Be curious and encouraging, never judgmental
- If the answer is surface-level or vague, gently invite them to go deeper with ONE specific follow-up question
- If the answer is rich and thoughtful, simply affirm and transition naturally
- Keep your response to 2-4 sentences max — you are a coach in a spoken conversation
- Do NOT repeat the question back to them
- Do NOT use generic filler phrases like "That's great!" or "Wonderful!"
- Reference earlier answers when you notice a meaningful pattern
- Write for SPOKEN delivery — avoid bullet points, markdown, or lists${context}`,
          },
          {
            role: "user",
            content: `The user just answered Question ${input.questionId} from Section "${section?.title}":

Question: "${question.question}"
Frameworks: ${question.frameworks.join(", ")}
Their answer: "${input.answer}"

Respond as their career coach. Write naturally for spoken delivery.`,
          },
        ];

        const response = await invokeLLM({ messages });
        const rawContent = response.choices[0]?.message?.content;
        const aiResponse = typeof rawContent === "string" ? rawContent : "Thank you for sharing that.";

        // Save the AI response to the DB
        const session = await db.getOrCreateSession(ctx.user.id);
        await db.updateAnswerAiResponse(session.id, input.questionId, aiResponse);

        // Synthesize speech if requested
        let audioBase64: string | null = null;
        if (input.withAudio) {
          const audioBuffer = await synthesizeSpeech(aiResponse, input.voiceId);
          if (audioBuffer) {
            audioBase64 = audioBuffer.toString("base64");
          }
        }

        return { response: aiResponse, audioBase64 };
      }),

    // Speak a question via ElevenLabs
    speakText: protectedProcedure
      .input(z.object({ text: z.string(), voiceId: z.string().optional() }))
      .mutation(async ({ input }) => {
        const audioBuffer = await synthesizeSpeech(input.text, input.voiceId);
        if (!audioBuffer) return { audioBase64: null };
        return { audioBase64: audioBuffer.toString("base64") };
      }),

    // Voice transcription
    transcribeVoice: protectedProcedure
      .input(z.object({
        audioBase64: z.string(),
        mimeType: z.string().default("audio/m4a"),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.audioBase64, "base64");
        const ext = input.mimeType.includes("webm") ? "webm" : "m4a";
        const key = `voice/${ctx.user.id}/${Date.now()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        const result = await transcribeAudio({ audioUrl: url, language: "en" });
        // Type guard: WhisperResponse has .text, TranscriptionError has .error
        if ("text" in result) {
          return { text: (result as WhisperResponse).text };
        }
        throw new Error("Transcription failed");
      }),

    // Generate Career Canvas suggestions from all answers
    generateCareerCanvas: protectedProcedure
      .mutation(async ({ ctx }) => {
        const session = await db.getOrCreateSession(ctx.user.id);
        const answers = await db.getAnswersBySession(session.id);
        const answerContext = buildAnswerContext(answers.map((a) => ({ questionId: a.questionId, answer: a.answer })));

        const messages: Message[] = [
          {
            role: "system",
            content: `You are a career strategist. Based on a user's career discovery interview answers, generate concise, specific Career Canvas entries. Return JSON only.`,
          },
          {
            role: "user",
            content: `Based on these interview answers, generate a Career Canvas for this person.${answerContext}

Return JSON with these exact keys: key_resources, key_activities, value_proposition, customers, channels, revenue_streams, key_partners, cost_structure.
Each value should be 2-3 specific bullet points as a single string separated by newlines. Be specific to their actual answers, not generic.`,
          },
        ];

        const response = await invokeLLM({ messages, response_format: { type: "json_object" } });
        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "{}";
        return JSON.parse(content) as Record<string, string>;
      }),

    // Generate full synthesis report
    generateSynthesis: protectedProcedure
      .mutation(async ({ ctx }) => {
        const session = await db.getOrCreateSession(ctx.user.id);
        const answers = await db.getAnswersBySession(session.id);
        const user = await db.getUserById(ctx.user.id);
        const answerContext = buildAnswerContext(answers.map((a) => ({ questionId: a.questionId, answer: a.answer })));

        const messages: Message[] = [
          {
            role: "system",
            content: `You are a career strategist synthesizing a career discovery interview. Write in second person ("you"), be specific and personal, referencing actual things the person said. Be insightful, warm, and direct. Return JSON only.`,
          },
          {
            role: "user",
            content: `Generate a synthesis report for ${user?.name ?? "this person"} based on their career discovery interview.${answerContext}

Return JSON with these exact keys:
- hedgehog_overlap: 2-3 sentences on where their passion, skill, and economic value intersect
- zone_of_genius: 2-3 sentences identifying their true Zone of Genius vs. Zone of Excellence trap
- ikigai_sweet_spot: 2-3 sentences on where their gifts meet a real need in the world
- energy_patterns_positive: 3-5 specific things that give them energy (as a string with newlines)
- energy_patterns_draining: 3-5 specific things that drain their energy (as a string with newlines)
- key_insight: One powerful, personalized insight that ties everything together (2-3 sentences)`,
          },
        ];

        const response = await invokeLLM({ messages, response_format: { type: "json_object" } });
        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "{}";
        return JSON.parse(content) as Record<string, string>;
      }),

    // Reset session — delete all answers and start fresh
    resetSession: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.resetSession(ctx.user.id);
        return { success: true };
      }),

    // Send synthesis report via email
    sendEmail: protectedProcedure
      .input(z.object({
        synthesis: z.record(z.string(), z.string()),
        careerCanvas: z.record(z.string(), z.string()),
        nextSteps: z.array(z.object({ action: z.string(), deadline: z.string() })),
        odysseyPaths: z.object({ path_a: z.string(), path_b: z.string(), path_c: z.string() }),
        odysseyRatings: z.record(z.string(), z.record(z.string(), z.number())),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user?.email) return { success: false, reason: "No email on file" };

        const name = user.name ?? "there";
        const { synthesis, careerCanvas, nextSteps, odysseyPaths, odysseyRatings } = input;

        const pathLabels: Record<string, string> = {
          path_a: "Path A — The Tweaked Path",
          path_b: "Path B — The Pivot",
          path_c: "Path C — The Wildcard",
        };

        const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:680px;margin:0 auto;padding:40px 20px;color:#1B2A4A;background:#F0F4F8}
  .card{background:white;border-radius:16px;padding:32px;margin-bottom:24px}
  h1{color:#1B2A4A;font-size:28px;margin:0 0 8px}
  h2{color:#1B2A4A;font-size:18px;border-bottom:2px solid #C9A84C;padding-bottom:8px}
  h3{color:#6B7A99;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px}
  p{line-height:1.7;color:#2D3A5A;margin:0 0 8px}
  .tagline{color:#6B7A99;font-size:16px}
  .canvas-block{background:#F0F4F8;border-radius:10px;padding:16px;margin-bottom:12px}
  .step{background:#F0F4F8;border-radius:10px;padding:16px;margin-bottom:12px}
  .path-card{background:#F0F4F8;border-radius:10px;padding:16px;margin-bottom:12px}
  .score-pill{display:inline-block;background:#1B2A4A;color:white;border-radius:20px;padding:3px 10px;font-size:12px;margin:4px 4px 0 0}
  .quote{border-left:4px solid #C9A84C;padding-left:20px;margin:24px 0;font-style:italic;color:#6B7A99}
  footer{text-align:center;color:#6B7A99;font-size:13px;margin-top:32px}
  .gold{color:#C9A84C;font-weight:600}
</style></head>
<body>
  <div class="card">
    <h1>Your Career Discovery Report</h1>
    <p class="tagline">Hi ${name} — here's everything that emerged from your career discovery interview.</p>
  </div>
  ${synthesis.hedgehog_overlap ? `<div class="card"><h2>The Hedgehog Overlap</h2><p>${synthesis.hedgehog_overlap}</p></div>` : ""}
  ${synthesis.zone_of_genius ? `<div class="card"><h2>Your Zone of Genius</h2><p>${synthesis.zone_of_genius}</p></div>` : ""}
  ${synthesis.ikigai_sweet_spot ? `<div class="card"><h2>Your Ikigai Sweet Spot</h2><p>${synthesis.ikigai_sweet_spot}</p></div>` : ""}
  ${(synthesis.energy_patterns_positive || synthesis.energy_patterns_draining) ? `<div class="card"><h2>Energy Patterns</h2>${synthesis.energy_patterns_positive ? `<h3 style="color:#2D9E6B">Gives You Energy</h3><p style="white-space:pre-line">${synthesis.energy_patterns_positive}</p>` : ""}${synthesis.energy_patterns_draining ? `<h3 style="color:#D94F4F;margin-top:16px">Drains Your Energy</h3><p style="white-space:pre-line">${synthesis.energy_patterns_draining}</p>` : ""}</div>` : ""}
  ${synthesis.key_insight ? `<div class="card" style="border-left:4px solid #C9A84C"><h2>Key Insight</h2><p>${synthesis.key_insight}</p></div>` : ""}
  <div class="card"><h2>Three Odyssey Paths</h2>${["path_a","path_b","path_c"].map(p=>{const text=odysseyPaths[p as keyof typeof odysseyPaths];const ratings=odysseyRatings[p]??{};if(!text)return"";return`<div class="path-card"><p class="gold">${pathLabels[p]}</p><p style="font-size:14px;margin:8px 0">${text}</p>${Object.entries(ratings).map(([d,v])=>`<span class="score-pill">${d.charAt(0).toUpperCase()+d.slice(1)}: ${v}/5</span>`).join("")}</div>`;}).join("")}</div>
  <div class="card"><h2>Career Canvas</h2>${Object.entries(careerCanvas).filter(([,v])=>v).map(([k,v])=>`<div class="canvas-block"><h3>${k.replace(/_/g," ").toUpperCase()}</h3><p style="white-space:pre-line;font-size:14px">${v}</p></div>`).join("")}</div>
  ${nextSteps.some(s=>s.action)?`<div class="card"><h2>Your Next Steps</h2>${nextSteps.filter(s=>s.action).map((s,i)=>`<div class="step"><p><strong>${i+1}. ${s.action}</strong>${s.deadline?`<br><span style="font-size:13px;color:#6B7A99">By: ${s.deadline}</span>`:""}</p></div>`).join("")}</div>`:""}
  <div class="quote"><p>"The fox knows many things, but the hedgehog knows one big thing." — Archilochus, via Jim Collins</p><p>The goal isn't to find the one perfect answer today. It's to see the patterns clearly enough to take the next right step.</p></div>
  <footer>Career Discovery Interview</footer>
</body></html>`;

        const text = [
          `Your Career Discovery Report`,
          `Hi ${name},`,
          synthesis.hedgehog_overlap,
          synthesis.zone_of_genius,
          synthesis.ikigai_sweet_spot,
          synthesis.key_insight,
          `"The fox knows many things, but the hedgehog knows one big thing." — Archilochus`,
        ].filter(Boolean).join("\n\n");

        const sent = await sendReportEmail({
          toEmail: user.email,
          toName: name,
          reportHtml: html,
          reportText: text,
        });

        if (sent) {
          await db.updateSession(ctx.user.id, { emailSent: true });
        }

        return { success: sent };
      }),
  }),
});

export type AppRouter = typeof appRouter;
