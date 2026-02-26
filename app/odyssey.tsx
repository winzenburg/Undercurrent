import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
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
import { useColors } from "@/hooks/use-colors";
import { useVoice } from "@/hooks/use-voice";
import { trpc } from "@/lib/trpc";
import { getSelectedVoice } from "@/lib/voice-store";
import { ODYSSEY_PATHS, ODYSSEY_DIMENSIONS } from "@/constants/interview-data";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";

type PathId = "path_a" | "path_b" | "path_c";

const PATH_PROMPTS: Record<PathId, string> = {
  path_a: "Path A — The Tweaked Path. Imagine you continue on your current trajectory, but make smart adjustments. What does your life look like in five years? Where do you live? What does a typical Tuesday feel like? Who do you work with?",
  path_b: "Path B — The Pivot. Imagine your current path disappears tomorrow — your job, your industry, gone. What do you do instead? Be specific. What does this new path look like in five years?",
  path_c: "Path C — The Wildcard. Money doesn't matter. Other people's opinions don't matter. Anything is possible. What's the life you'd actually want? Describe it in detail.",
};

const RATING_INTRO: Record<PathId, string> = {
  path_a: "Now let's rate Path A on four dimensions from one to five.",
  path_b: "Now let's rate Path B on four dimensions from one to five.",
  path_c: "And finally, let's rate Path C on four dimensions from one to five.",
};

type Phase = "path_entry" | "path_rating";

export default function OdysseyScreen() {
  const colors = useColors();
  const router = useRouter();
  useKeepAwake();

  const [pathIndex, setPathIndex] = useState(0); // 0=A, 1=B, 2=C
  const [phase, setPhase] = useState<Phase>("path_entry");
  const [paths, setPaths] = useState<Record<PathId, string>>({ path_a: "", path_b: "", path_c: "" });
  const [ratings, setRatings] = useState<Record<PathId, Record<string, number>>>({
    path_a: { engagement: 0, energy: 0, confidence: 0, coherence: 0 },
    path_b: { engagement: 0, energy: 0, confidence: 0, coherence: 0 },
    path_c: { engagement: 0, energy: 0, confidence: 0, coherence: 0 },
  });
  const [textInput, setTextInput] = useState("");
  const [isTextMode, setIsTextMode] = useState(false);
  const [voiceId, setVoiceId] = useState("21m00Tcm4TlvDq8ikWAM");
  const [hasSpoken, setHasSpoken] = useState(false);

  const updateProgressMutation = trpc.interview.updateProgress.useMutation();
  const saveAnswerMutation = trpc.interview.saveAnswer.useMutation();

  const currentPathId = (["path_a", "path_b", "path_c"] as PathId[])[pathIndex];
  const currentPath = ODYSSEY_PATHS[pathIndex];

  const { voiceState, speak, stopSpeaking, startRecording, stopRecording } = useVoice({
    onTranscription: (text) => {
      if (phase === "path_entry") handleSubmitPath(text);
    },
    onError: () => setIsTextMode(true),
  });

  useEffect(() => {
    getSelectedVoice().then((v) => setVoiceId(v.voice_id));
  }, []);

  // Speak prompt when path or phase changes
  useEffect(() => {
    if (hasSpoken) return;
    const prompt =
      phase === "path_entry"
        ? PATH_PROMPTS[currentPathId]
        : RATING_INTRO[currentPathId];
    setHasSpoken(false);
    speak(prompt).then(() => setHasSpoken(true));
  }, [pathIndex, phase]);

  const handleSubmitPath = async (text: string) => {
    if (!text.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const updated = { ...paths, [currentPathId]: text.trim() };
    setPaths(updated);
    setTextInput("");

    // Save as answer to Q17
    try {
      await saveAnswerMutation.mutateAsync({ questionId: 17, answer: JSON.stringify(updated) });
    } catch { /* ignore */ }

    // Move to rating phase
    setHasSpoken(false);
    setPhase("path_rating");
  };

  const handleRating = (dimension: string, value: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRatings((prev) => ({
      ...prev,
      [currentPathId]: { ...prev[currentPathId], [dimension]: value },
    }));
  };

  const handleRatingsDone = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (pathIndex < 2) {
      // Move to next path
      setPathIndex((i) => i + 1);
      setPhase("path_entry");
      setHasSpoken(false);
    } else {
      // All paths done — save and go to career canvas
      await updateProgressMutation.mutateAsync({
        odysseyPaths: paths,
        odysseyRatings: ratings,
      });
      router.push("/career-canvas" as any);
    }
  };

  const allRated = Object.values(ratings[currentPathId]).every((v) => v > 0);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>06 — Prototyping the Future</Text>
            <Text style={[styles.pathLabel, { color: currentPath.color }]}>
              {currentPath.label}: {currentPath.title}
            </Text>
          </View>
          <Pressable
            onPress={() => setIsTextMode((v) => !v)}
            style={({ pressed }) => [{ padding: 8, opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.modeToggle, { color: colors.muted }]}>
              {isTextMode ? "🎙 Voice" : "⌨ Type"}
            </Text>
          </Pressable>
        </View>

        {/* Path progress dots */}
        <View style={styles.pathDots}>
          {ODYSSEY_PATHS.map((p, i) => (
            <View
              key={p.id}
              style={[
                styles.pathDot,
                {
                  backgroundColor: i < pathIndex ? p.color : i === pathIndex ? p.color : colors.border,
                  opacity: i === pathIndex ? 1 : i < pathIndex ? 0.6 : 0.3,
                  width: i === pathIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {phase === "path_entry" ? (
            <>
              {/* Path description */}
              <View style={[styles.pathCard, { backgroundColor: colors.surface, borderColor: currentPath.color }]}>
                <Text style={[styles.pathCardTitle, { color: currentPath.color }]}>
                  {currentPath.label} — {currentPath.title}
                </Text>
                <Text style={[styles.pathCardDesc, { color: colors.muted }]}>
                  {currentPath.description}
                </Text>
              </View>

              {/* Voice orb or text input */}
              {!isTextMode ? (
                <View style={styles.orbArea}>
                  <VoiceOrb state={voiceState} onPress={() => {
                    if (voiceState === "speaking") stopSpeaking();
                    else if (voiceState === "listening") stopRecording();
                    else startRecording();
                  }} size={90} />
                  <Text style={[styles.orbHint, { color: colors.muted }]}>
                    {voiceState === "speaking" ? "Tap to interrupt"
                      : voiceState === "listening" ? "Listening... tap to send"
                      : voiceState === "thinking" ? "Processing..."
                      : "Tap to describe this path"}
                  </Text>
                  {paths[currentPathId] ? (
                    <View style={[styles.savedAnswer, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.savedLabel, { color: colors.muted }]}>Your answer:</Text>
                      <Text style={[styles.savedText, { color: colors.foreground }]}>{paths[currentPathId]}</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={styles.textArea}>
                  <TextInput
                    value={textInput}
                    onChangeText={setTextInput}
                    placeholder={`Describe ${currentPath.label}...`}
                    placeholderTextColor={colors.muted}
                    style={[styles.textInput, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                    multiline
                    maxLength={3000}
                  />
                  <Pressable
                    onPress={() => handleSubmitPath(textInput)}
                    style={({ pressed }) => [
                      styles.submitBtn,
                      { backgroundColor: currentPath.color },
                      pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                      !textInput.trim() && { opacity: 0.4 },
                    ]}
                    disabled={!textInput.trim()}
                  >
                    <Text style={styles.submitBtnText}>Save & Rate This Path</Text>
                  </Pressable>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Rating phase */}
              <Text style={[styles.ratingTitle, { color: colors.foreground }]}>
                Rate {currentPath.label}: {currentPath.title}
              </Text>
              <Text style={[styles.ratingSubtitle, { color: colors.muted }]}>
                Score each dimension from 1 (low) to 5 (high)
              </Text>

              {ODYSSEY_DIMENSIONS.map((dim) => (
                <View key={dim.id} style={[styles.dimensionCard, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.dimensionLabel, { color: colors.foreground }]}>{dim.label}</Text>
                  <Text style={[styles.dimensionDesc, { color: colors.muted }]}>{dim.description}</Text>
                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((val) => {
                      const selected = ratings[currentPathId][dim.id] === val;
                      return (
                        <Pressable
                          key={val}
                          onPress={() => handleRating(dim.id, val)}
                          style={({ pressed }) => [
                            styles.ratingBtn,
                            {
                              backgroundColor: selected ? currentPath.color : colors.sectionBg,
                              borderColor: selected ? currentPath.color : colors.border,
                              opacity: pressed ? 0.8 : 1,
                            },
                          ]}
                        >
                          <Text style={[styles.ratingBtnText, { color: selected ? "#fff" : colors.muted }]}>
                            {val}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}

              <Pressable
                onPress={handleRatingsDone}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: allRated ? currentPath.color : colors.border },
                  pressed && allRated && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                ]}
                disabled={!allRated}
              >
                <Text style={[styles.submitBtnText, { color: allRated ? "#fff" : colors.muted }]}>
                  {pathIndex < 2 ? `Next: ${ODYSSEY_PATHS[pathIndex + 1].label}` : "Continue to Career Canvas"}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerLeft: { flex: 1 },
  sectionLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.04 },
  pathLabel: { fontSize: 15, fontWeight: "700", marginTop: 2 },
  modeToggle: { fontSize: 13, fontWeight: "600" },
  pathDots: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
  pathDot: { height: 8, borderRadius: 4 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  pathCard: { borderRadius: 14, padding: 16, borderLeftWidth: 4 },
  pathCardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 6 },
  pathCardDesc: { fontSize: 14, lineHeight: 20 },
  orbArea: { alignItems: "center", gap: 12, paddingVertical: 16 },
  orbHint: { fontSize: 13, textAlign: "center" },
  savedAnswer: { borderRadius: 12, padding: 14, width: "100%" },
  savedLabel: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  savedText: { fontSize: 14, lineHeight: 20 },
  textArea: { gap: 12 },
  textInput: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, lineHeight: 22, minHeight: 120 },
  submitBtn: { borderRadius: 28, paddingVertical: 15, alignItems: "center" },
  submitBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  ratingTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.2 },
  ratingSubtitle: { fontSize: 14, lineHeight: 20 },
  dimensionCard: { borderRadius: 14, padding: 16, gap: 8 },
  dimensionLabel: { fontSize: 16, fontWeight: "700" },
  dimensionDesc: { fontSize: 13, lineHeight: 18 },
  ratingRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  ratingBtn: { flex: 1, aspectRatio: 1, borderRadius: 10, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  ratingBtnText: { fontSize: 16, fontWeight: "700" },
});
