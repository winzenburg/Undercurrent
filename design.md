# Career Discovery Interview — Design Document

## Brand & Visual Identity

**App Name:** The Career Discovery Interview  
**Tagline:** See the patterns. Take the next right step.

### Color Palette
- **Primary Navy:** `#1B2A4A` — Deep, trustworthy, grounding
- **Gold Accent:** `#C9A84C` — Warmth, insight, discovery
- **Soft Blue-Gray Background:** `#F0F4F8` — Calm, spacious
- **Surface White:** `#FFFFFF` — Clean cards
- **Muted Text:** `#6B7A99` — Secondary info
- **Border:** `#DDE3EF` — Subtle separators
- **Success Green:** `#2D9E6B`
- **Warning Amber:** `#E6A817`
- **Error Red:** `#D94F4F`

### Typography
- Font: System default (SF Pro on iOS, Roboto on Android) — clean, readable
- Headings: Bold, navy
- Body: Regular, dark navy
- Captions/tags: Small, muted blue-gray

---

## Screen List

1. **Welcome Screen** — App intro, name entry, session options
2. **How It Works Screen** — Framework overview, time estimate, expectations
3. **Interview Screen** — One question at a time, AI response bubbles, follow-up prompts
4. **Odyssey Plans Screen** — Three path descriptions + interactive 4-dimension rating matrix (Q17+Q18)
5. **Career Canvas Screen** — 8-block visual canvas, AI-prefilled, user-editable
6. **Synthesis Report Screen** — Full personalized report with Hedgehog, Ikigai, Zone of Genius, energy patterns, Odyssey scores, next steps
7. **Settings / Progress Screen** — Resume session, view saved answers, reset

---

## Key User Flows

### Primary Flow: First-Time User
1. Open app → Welcome Screen (name entry, start button)
2. Tap "Begin Interview" → How It Works (brief overview, tap Continue)
3. Section 1 starts → Q1 displayed, user types answer
4. AI acknowledges answer → option to continue or use follow-up prompts
5. Progress through all 8 sections (19 questions)
6. Q17/Q18 → Odyssey Plans interactive rating screen
7. Career Canvas → AI pre-fills, user edits
8. Synthesis Report → full summary, export/share options
9. Closing quote screen

### Resume Flow
1. Open app → Welcome Screen detects saved progress
2. "Continue where you left off" button → returns to last question

---

## Screen Designs

### Welcome Screen
- Large app name centered, tagline below
- "Your name" text input (optional)
- "Begin Interview" primary CTA button (navy, full-width)
- "Continue where I left off" secondary link (if progress exists)
- Small framework logos/badges at bottom

### How It Works Screen
- Section header: "What to expect"
- 3 key points in icon+text rows: Duration (~60-90 min), Frameworks (6 integrated), Approach (no wrong answers)
- Framework tags: Hedgehog · Ikigai · Design Your Life · Zone of Genius · Strengths · Career Canvas
- "Let's Begin" button

### Interview Screen (Core)
- **Top bar:** Section name (e.g., "Section 1 · The Warm-Up") + section dot indicators (8 dots)
- **Framework badge(s):** Small pill tags (e.g., "Hedgehog" "Ikigai") in gold
- **Question bubble:** Large, readable question text in a soft card
- **AI coach message:** After answer submitted — acknowledgment/reflection in a distinct AI bubble (navy left-aligned)
- **Answer input:** Multi-line text area, "Send" button
- **Follow-up prompts:** Collapsible "Need a nudge?" section with 2-3 follow-up questions as tappable chips
- **Navigation:** "← Back" ghost button, progress section dots at top

### Odyssey Plans Screen (Q17 + Q18)
- Three path cards (Path A, B, C) with description text areas
- Below each: 4-dimension rating row (Engagement / Energy / Confidence / Coherence) with 1-5 star/dot selectors
- Visual score summary table at bottom

### Career Canvas Screen
- 8 blocks in a grid layout (Business Model Canvas style)
- Each block: title, AI-suggested content (editable), tap to edit
- "Regenerate suggestions" button
- "Continue to Report" CTA

### Synthesis Report Screen
- Scrollable report with named sections
- Hedgehog Venn diagram (3 overlapping circles: Passion / Skill / Economic Value)
- Ikigai sweet spot callout
- Zone of Genius vs. Zone of Excellence contrast
- Energy patterns (what gives / what drains)
- Odyssey Plans score visualization (bar or radar)
- Career Canvas summary
- 3 Next Steps with deadline inputs
- "Export as PDF" and "Share" buttons

---

## Interaction Patterns
- One question at a time — no scrolling walls of text
- Auto-save on every answer submission (AsyncStorage)
- Haptic feedback on primary actions
- Smooth fade/slide transitions between questions
- "Back" always available to edit previous answers
- Section completion micro-celebration (subtle animation)
