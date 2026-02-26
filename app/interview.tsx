import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { VoiceOrb } from "@/components/VoiceOrb";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useVoice } from "@/hooks/use-voice";
import { trpc } from "@/lib/trpc";
import { getSelectedVoice } from "@/lib/voice-store";
import { QUESTIONS, SECTIONS, FRAMEWORK_COLORS } from "@/constants/interview-data";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";

type ConversationEntry =
  | { role: "coach"; text: string }
  | { role: "user"; text: string };

const TOTAL_QUESTIONS = QUESTIONS.filter((q) => !q.isOdysseyRating).length;

export default function InterviewScreen() {
  const colors = useColors();
  const router = useRouter();
  useKeepAwake();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [textInput, setTextInput] = useState("");
  const [isTextMode, setIsTextMode] = useState(false);
  const hasSpokenRef = useRef(false);
  const userHasInteractedRef = useRef(false); // Web autoplay policy: audio blocked until first user gesture
  const [awaitingFirstTap, setAwaitingFirstTap] = useState(Platform.OS === "web");
  // conversationMode controls whether the user is answering the main question or a follow-up
  // 'main'    — user is answering the current main question
  // 'followup' — AI has responded; user can reply to the follow-up OR tap "Next Question"
  const [conversationMode, setConversationMode] = useState<"main" | "followup">("main");
  const [voiceId, setVoiceId] = useState<string>("21m00Tcm4TlvDq8ikWAM");
  const [previousAnswers, setPreviousAnswers] = useState<Array<{ questionId: number; answer: string }>>([])
  const [pendingNextIndex, setPendingNextIndex] = useState<number | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const saveAnswerMutation = trpc.interview.saveAnswer.useMutation();
  const getAiResponseMutation = trpc.interview.getAiResponse.useMutation();
  const updateProgressMutation = trpc.interview.updateProgress.useMutation();

  // Filter out odyssey rating question from the main flow
  const mainQuestions = QUESTIONS.filter((q) => !q.isOdysseyRating);
  const currentQuestion = mainQuestions[currentQuestionIndex];
  const currentSection = currentQuestion ? SECTIONS.find((s) => s.id === currentQuestion.sectionId) : null;
  const progress = (currentQuestionIndex / TOTAL_QUESTIONS) * 100;

  const { voiceState, speak, stopSpeaking, startRecording, stopRecording, isRecording } = useVoice({
    onTranscription: (text) => {
      handleSubmitAnswer(text);
    },
    onError: (err) => {
      console.warn("[Interview] Voice error:", err);
      setIsTextMode(true);
    },
  });

  // Load selected voice on mount
  useEffect(() => {
    getSelectedVoice().then((v) => setVoiceId(v.voice_id));
  }, []);

  // Build the intro text for the current question
  const buildIntro = useCallback((qIndex: number) => {
    const q = mainQuestions[qIndex];
    if (!q) return "";
    const sec = SECTIONS.find((s) => s.id === q.sectionId);
    return sec && qIndex === 0
      ? `Welcome to Undercurrent. I'm your career discovery coach. Let's start with ${sec.title}. ${sec.subtitle}. Here's your first question: ${q.question}`
      : q.question;
  }, [mainQuestions]);

  // Speak the current question when the index changes — use a ref guard to prevent double-firing
  // On web, defer until the user has tapped (browser autoplay policy)
  useEffect(() => {
    if (!currentQuestion) return;
    if (hasSpokenRef.current) return;
    hasSpokenRef.current = true;

    // Always add the question text to the conversation immediately
    setConversation((prev) => [...prev, { role: "coach", text: currentQuestion.question }]);

    // On web, wait for user interaction before playing audio
    if (Platform.OS === "web" && !userHasInteractedRef.current) {
      setAwaitingFirstTap(true);
      return;
    }

    speak(buildIntro(currentQuestionIndex));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // Advance to the next main question (called explicitly by user)
  const advanceToNextQuestion = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nextIndex = pendingNextIndex ?? currentQuestionIndex + 1;
    setConversationMode("main");
    setPendingNextIndex(null);
    if (nextIndex >= mainQuestions.length) {
      updateProgressMutation.mutate({
        currentQuestionId: 17,
        completedSections: SECTIONS.map((s) => s.id),
      });
      router.push("/odyssey");
    } else {
      hasSpokenRef.current = false;
      setCurrentQuestionIndex(nextIndex);
      updateProgressMutation.mutate({ currentQuestionId: mainQuestions[nextIndex].id });
    }
  }, [pendingNextIndex, currentQuestionIndex, mainQuestions]);

  const handleSubmitAnswer = useCallback(
    async (answer: string) => {
      if (!answer.trim() || !currentQuestion) return;
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const trimmed = answer.trim();
      setTextInput("");

      // Add user message to conversation
      setConversation((prev) => [...prev, { role: "user", text: trimmed }]);

      // If this is a follow-up reply, save it appended to the main answer and advance
      if (conversationMode === "followup") {
        // Save the follow-up reply as additional context (append to last answer)
        try {
          await saveAnswerMutation.mutateAsync({
            questionId: currentQuestion.id,
            answer: `[Follow-up reply] ${trimmed}`,
          });
        } catch (e) {
          console.warn("[Interview] Failed to save follow-up reply:", e);
        }
        // After user responds to follow-up, advance to next question automatically
        advanceToNextQuestion();
        return;
      }

      // Main question answer — save to DB
      try {
        await saveAnswerMutation.mutateAsync({
          questionId: currentQuestion.id,
          answer: trimmed,
        });
      } catch (e) {
        console.warn("[Interview] Failed to save answer:", e);
      }

      // Compute next index now so we can store it
      const nextIndex = currentQuestionIndex + 1;
      setPendingNextIndex(nextIndex);

      // Get AI coaching response + audio
      try {
        const aiResult = await getAiResponseMutation.mutateAsync({
          questionId: currentQuestion.id,
          answer: trimmed,
          previousAnswers,
          withAudio: true,
          voiceId,
        });

        const aiText = aiResult.response;
        setConversation((prev) => [...prev, { role: "coach", text: aiText }]);

        // Update previous answers for context
        const updated = [...previousAnswers, { questionId: currentQuestion.id, answer: trimmed }];
        setPreviousAnswers(updated);

        // Play audio response if available
        if (aiResult.audioBase64) {
          await playBase64Audio(aiResult.audioBase64);
        } else {
          await speak(aiText);
        }

        // *** KEY CHANGE: Do NOT auto-advance. Switch to follow-up mode so user can respond. ***
        setConversationMode("followup");
      } catch (e) {
        console.warn("[Interview] AI response failed:", e);
        // On error, just advance to next question
        advanceToNextQuestion();
      }
    },
    [currentQuestion, currentQuestionIndex, conversationMode, previousAnswers, voiceId, mainQuestions, advanceToNextQuestion]
  );

  const playBase64Audio = async (base64: string) => {
    if (Platform.OS === "web") {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      return new Promise<void>((resolve) => {
        const audio = new Audio(url);
        audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
        audio.play().catch(() => resolve());
      });
    }
  };

  const handleOrbPress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // On web: first tap unlocks audio autoplay and speaks the pending question
    if (awaitingFirstTap && Platform.OS === "web") {
      userHasInteractedRef.current = true;
      setAwaitingFirstTap(false);
      speak(buildIntro(currentQuestionIndex));
      return;
    }

    if (voiceState === "speaking") {
      stopSpeaking();
    } else if (voiceState === "listening") {
      stopRecording();
    } else if (voiceState === "idle") {
      startRecording();
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      // Text submission also counts as user interaction for web autoplay
      userHasInteractedRef.current = true;
      setAwaitingFirstTap(false);
      handleSubmitAnswer(textInput);
    }
  };

  const sectionColor = currentSection?.color ?? colors.primary;

  return (
    <ScreenContainer containerClassName="bg-background" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.muted} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.sectionTag, { color: sectionColor }]}>
              {currentSection?.number} — {currentSection?.title}
            </Text>
            <Text style={[styles.questionCounter, { color: colors.muted }]}>
              {currentQuestionIndex + 1} of {TOTAL_QUESTIONS}
            </Text>
          </View>
          <Pressable
            onPress={() => setIsTextMode((v) => !v)}
            style={({ pressed }) => [styles.modeBtn, pressed && { opacity: 0.6 }]}
          >
            <IconSymbol
              name={isTextMode ? "mic.fill" : "pencil"}
              size={20}
              color={colors.muted}
            />
          </Pressable>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: sectionColor }]} />
        </View>

        {/* Framework tags */}
        {currentQuestion && (
          <View style={styles.frameworkRow}>
            {currentQuestion.frameworks.map((f) => (
              <View key={f} style={[styles.frameworkTag, { borderColor: FRAMEWORK_COLORS[f] }]}>
                <Text style={[styles.frameworkTagText, { color: FRAMEWORK_COLORS[f] }]}>{f}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Conversation */}
        <ScrollView
          ref={scrollRef}
          style={styles.conversationScroll}
          contentContainerStyle={styles.conversationContent}
          showsVerticalScrollIndicator={false}
        >
          {conversation.map((entry, i) => (
            <View
              key={i}
              style={[
                styles.bubble,
                entry.role === "coach"
                  ? [styles.coachBubble, { backgroundColor: colors.surface }]
                  : [styles.userBubble, { backgroundColor: sectionColor }],
              ]}
            >
              {entry.role === "coach" && (
                <Text style={[styles.bubbleLabel, { color: colors.muted }]}>Coach</Text>
              )}
              <Text
                style={[
                  styles.bubbleText,
                  { color: entry.role === "coach" ? colors.foreground : "#fff" },
                ]}
              >
                {entry.text}
              </Text>
            </View>
          ))}
          {(voiceState === "thinking" || getAiResponseMutation.isPending) && (
            <View style={[styles.bubble, styles.coachBubble, { backgroundColor: colors.surface }]}>
              <Text style={[styles.bubbleLabel, { color: colors.muted }]}>Coach</Text>
              <View style={styles.typingDots}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={[styles.dot, { backgroundColor: colors.muted }]} />
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Voice orb + input area */}
        <View style={[styles.inputArea, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {!isTextMode ? (
            <View style={styles.orbArea}>
              <VoiceOrb state={voiceState} onPress={handleOrbPress} size={80} />
              <Text style={[styles.orbHint, { color: colors.muted }]}>
                {awaitingFirstTap
                  ? "Tap to hear your question"
                  : voiceState === "speaking"
                  ? "Tap to interrupt"
                  : voiceState === "listening"
                  ? "Listening... tap to send"
                  : voiceState === "thinking"
                  ? "Processing..."
                  : conversationMode === "followup"
                  ? "Tap to respond, or skip to next question"
                  : "Tap to speak your answer"}
              </Text>
              {conversationMode === "followup" && voiceState === "idle" && (
                <Pressable
                  onPress={advanceToNextQuestion}
                  style={({ pressed }) => [
                    styles.nextBtn,
                    { backgroundColor: sectionColor },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <Text style={styles.nextBtnText}>Next Question →</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.textModeContainer}>
              {conversationMode === "followup" && (
                <Pressable
                  onPress={advanceToNextQuestion}
                  style={({ pressed }) => [
                    styles.skipFollowupBtn,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Text style={[styles.skipFollowupText, { color: colors.muted }]}>Skip → Next Question</Text>
                </Pressable>
              )}
              <View style={styles.textInputArea}>
              <TextInput
                ref={inputRef}
                value={textInput}
                onChangeText={setTextInput}
                placeholder={conversationMode === "followup" ? "Reply to the follow-up..." : "Type your answer..."}
                placeholderTextColor={colors.muted}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
                multiline
                maxLength={2000}
                returnKeyType="default"
              />
              <Pressable
                onPress={handleTextSubmit}
                style={({ pressed }) => [
                  styles.sendBtn,
                  { backgroundColor: sectionColor },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
                  !textInput.trim() && { opacity: 0.4 },
                ]}
                disabled={!textInput.trim()}
              >
                <IconSymbol name="paperplane.fill" size={20} color="#fff" />
              </Pressable>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    padding: 4,
    width: 36,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  sectionTag: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.04,
  },
  questionCounter: {
    fontSize: 11,
    marginTop: 2,
  },
  modeBtn: {
    padding: 4,
    width: 36,
    alignItems: "flex-end",
  },
  progressTrack: {
    height: 3,
    width: "100%",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  frameworkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  frameworkTag: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  frameworkTagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  conversationScroll: {
    flex: 1,
  },
  conversationContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: 16,
    padding: 14,
  },
  coachBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bubbleLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.06,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  typingDots: {
    flexDirection: "row",
    gap: 4,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
  inputArea: {
    borderTopWidth: 0.5,
    paddingBottom: Platform.OS === "ios" ? 20 : 12,
  },
  orbArea: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 10,
  },
  orbHint: {
    fontSize: 13,
    textAlign: "center",
  },
  textInputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 22,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 28,
    marginTop: 4,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  textModeContainer: {
    flexDirection: "column",
  },
  skipFollowupBtn: {
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  skipFollowupText: {
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
