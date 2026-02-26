# Undercurrent — TODO

## Setup & Configuration
- [x] Update theme colors (navy, gold, blue-gray)
- [x] Update app name and branding in app.config.ts (Undercurrent)
- [x] Set up navigation structure (tabs + stack screens)
- [x] Create interview data file (all 19 questions, sections, follow-ups, framework tags)
- [x] Set up AsyncStorage persistence for interview answers

## Screens
- [x] Welcome Screen (Undercurrent branding, OAuth login, framework overview)
- [x] Voice Selection Screen (5 ElevenLabs voices with preview)
- [x] Home Screen (progress, resume/start CTA, section overview)
- [x] Interview Screen (voice-first conversation flow, AI coaching responses)
- [x] Odyssey Plans Screen (sequential Path A/B/C entry + rating matrix)
- [x] Career Canvas Screen (8-block editable canvas with AI pre-fill)
- [x] Synthesis Report Screen (full report with email delivery)

## Interview Flow Logic
- [x] Question navigation (sequential, auto-advance after AI response)
- [x] Section progress tracking
- [x] Cloud-sync answers to DB (tRPC)
- [x] Resume session detection (load from DB on home screen)
- [x] AI coaching responses after each answer (ElevenLabs spoken + text)
- [x] Framework tags shown per question

## AI Integration
- [x] AI coach responses using server LLM (Manus built-in)
- [x] Context-aware responses referencing earlier answers
- [x] Career Canvas AI pre-fill from answers
- [x] Synthesis report AI generation (hedgehog, zone of genius, ikigai, energy patterns, key insight)

## Interactive Components
- [x] Odyssey Plans rating widget (1-5 per dimension per path)
- [x] Career Canvas editable blocks
- [x] VoiceOrb animated component (idle/speaking/listening/thinking states)

## Branding
- [x] Generate Undercurrent app logo (navy wave with gold crest)
- [x] Update app.config.ts with logo URL and name
- [x] Update splash screen, favicon, and android icon

## Auth & Backend
- [x] Database schema: interview_sessions and interview_answers tables
- [x] tRPC routes: getSession, saveAnswer, updateProgress, getAiResponse, speakText, transcribeVoice, generateCareerCanvas, generateSynthesis, sendEmail
- [x] Manus OAuth login/signup flow in app
- [x] Auth gate: require login before starting interview
- [x] Cloud-sync answers tied to user account
- [x] Email synthesis report via Resend API on completion

## Voice Input
- [x] Microphone permission handling (iOS + Android + Web)
- [x] Voice recording via expo-audio with animated VoiceOrb
- [x] Upload audio to S3, transcribe via Whisper API on server
- [x] Toggle between voice and keyboard input modes

## ElevenLabs Voice Experience ("Her" mode)
- [x] ElevenLabs TTS server route (eleven_turbo_v2_5 model)
- [x] Audio playback: Web (Audio API) + Native (expo-audio + FileSystem)
- [x] Animated VoiceOrb: pulsing while speaking, breathing while listening, rotating while thinking
- [x] Full conversation loop: AI speaks question → user records → Whisper transcribes → AI coaches → ElevenLabs speaks response → next question
- [x] Interrupt/pause: tap orb to stop AI speaking
- [x] Text mode toggle: switch between voice-first and text-first modes
- [x] RESEND_API_KEY secret configured
- [x] ELEVENLABS_API_KEY secret configured

## Branding & UX Decisions
- [x] App name: Undercurrent
- [x] Welcome screen copy: targets friends experiencing layoffs, burnout, AI job anxiety
- [x] Voice selection screen: pick from 5 ElevenLabs voices before starting
- [x] Odyssey Plans Q17: walk through Path A, B, C in sequence
- [x] Post-completion: email report only

## Future Enhancements
- [ ] PDF export of synthesis report
- [ ] Hedgehog Venn diagram visualization
- [ ] Odyssey Plans score radar chart
- [ ] Push notifications for incomplete sessions

## Bug Fixes & UX Improvements
- [x] Remove voice-select screen from onboarding loop (welcome → voice-select → welcome loop)
- [x] Default to Rachel voice without requiring selection
- [x] Add Settings tab with voice picker (change voice anytime)
- [x] Add Profile/Settings tab to tab bar

## Bug Fixes — Round 2
- [x] Fix Q1 voice loop bug (voice speaking in a loop on first question)
- [x] Add "Start Over" / reset session button in home screen and settings
- [x] Ensure TTS only fires once per question (guard against double-trigger on mount)

## Bug Fixes — Round 3
- [x] Fix voice audio not playing — questions not being spoken aloud via ElevenLabs TTS
- [x] Trace full audio pipeline: speakText tRPC → base64 → playback on device (ElevenLabs returns 23KB audio, web autoplay was the blocker)
- [x] Fix browser autoplay block — first question audio must be triggered by user tap, not on mount
- [x] Add "Tap to hear your question" state to orb so user interaction unlocks audio autoplay for all subsequent questions
