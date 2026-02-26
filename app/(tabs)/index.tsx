import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { VoiceOrb } from "@/components/VoiceOrb";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { SECTIONS, QUESTIONS } from "@/constants/interview-data";
import * as Haptics from "expo-haptics";

const TOTAL_QUESTIONS = QUESTIONS.filter((q) => !q.isOdysseyRating).length;

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const sessionQuery = trpc.interview.getSession.useQuery(undefined, {
    enabled: !!user,
  });

  const session = sessionQuery.data?.session;
  const answers = sessionQuery.data?.answers ?? [];
  const answeredCount = answers.length;
  const progress = Math.min((answeredCount / TOTAL_QUESTIONS) * 100, 100);
  const isComplete = session?.isComplete ?? false;

  const lastAnsweredQ = answers.length > 0
    ? QUESTIONS.find((q) => q.id === answers[answers.length - 1].questionId)
    : null;
  const currentSection = lastAnsweredQ
    ? SECTIONS.find((s) => s.id === lastAnsweredQ.sectionId)
    : SECTIONS[0];

  const handleStart = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isComplete) {
      router.push("/synthesis" as any);
    } else {
      router.push("/interview" as any);
    }
  };

  if (authLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.accent} />
      </ScreenContainer>
    );
  }

  if (!user) {
    router.replace("/welcome");
    return null;
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={[styles.greetingName, { color: colors.muted }]}>
            Hello, {user.name?.split(" ")[0] ?? "there"}
          </Text>
          <Text style={[styles.greetingTitle, { color: colors.foreground }]}>
            {isComplete
              ? "Discovery Complete"
              : answeredCount === 0
              ? "Begin Your Discovery"
              : "Your Discovery"}
          </Text>
        </View>

        {/* Voice orb + CTA */}
        <View style={styles.orbSection}>
          <VoiceOrb state="idle" size={100} />
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [
              styles.startBtn,
              { backgroundColor: colors.accent },
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={[styles.startBtnText, { color: colors.primary }]}>
              {isComplete
                ? "View My Synthesis"
                : answeredCount === 0
                ? "Start the Interview"
                : `Resume — Question ${answeredCount + 1}`}
            </Text>
          </Pressable>
          {answeredCount > 0 && !isComplete && (
            <Text style={[styles.progressLabel, { color: colors.muted }]}>
              {answeredCount} of {TOTAL_QUESTIONS} questions answered
            </Text>
          )}
        </View>

        {/* Progress bar */}
        {answeredCount > 0 && (
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.accent }]}
            />
          </View>
        )}

        {/* Sections overview */}
        <View style={styles.sectionsSection}>
          <Text style={[styles.sectionHeader, { color: colors.muted }]}>THE INTERVIEW</Text>
          {SECTIONS.map((section) => {
            const sectionQuestions = QUESTIONS.filter(
              (q) => q.sectionId === section.id && !q.isOdysseyRating
            );
            const answeredInSection = answers.filter((a) =>
              sectionQuestions.some((q) => q.id === a.questionId)
            ).length;
            const isFullyAnswered = answeredInSection === sectionQuestions.length;
            const isActive = currentSection?.id === section.id && !isComplete;

            return (
              <View
                key={section.id}
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: colors.surface,
                    borderLeftColor: isFullyAnswered ? colors.success : isActive ? section.color : colors.border,
                    borderLeftWidth: 3,
                  },
                ]}
              >
                <View style={styles.sectionCardHeader}>
                  <Text style={[styles.sectionNumber, { color: section.color }]}>{section.number}</Text>
                  <View style={styles.sectionCardText}>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{section.title}</Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>{section.subtitle}</Text>
                  </View>
                  <View style={styles.sectionStatus}>
                    {isFullyAnswered ? (
                      <View style={[styles.checkBadge, { backgroundColor: colors.success }]}>
                        <Text style={styles.checkText}>✓</Text>
                      </View>
                    ) : (
                      <Text style={[styles.sectionCount, { color: colors.muted }]}>
                        {answeredInSection}/{sectionQuestions.length}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, gap: 24 },
  greeting: { paddingTop: 8 },
  greetingName: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  greetingTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.4 },
  orbSection: { alignItems: "center", gap: 16 },
  startBtn: { paddingHorizontal: 32, paddingVertical: 15, borderRadius: 32 },
  startBtnText: { fontSize: 16, fontWeight: "700" },
  progressLabel: { fontSize: 13 },
  progressTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  sectionsSection: { gap: 10 },
  sectionHeader: { fontSize: 11, fontWeight: "700", letterSpacing: 0.08, marginBottom: 4 },
  sectionCard: { borderRadius: 12, padding: 14 },
  sectionCardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  sectionNumber: { fontSize: 12, fontWeight: "800", width: 28, lineHeight: 20 },
  sectionCardText: { flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  sectionSubtitle: { fontSize: 12, lineHeight: 16 },
  sectionStatus: { alignItems: "center", justifyContent: "center" },
  checkBadge: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  checkText: { fontSize: 12, color: "#fff", fontWeight: "700" },
  sectionCount: { fontSize: 12, fontWeight: "600" },
  voiceShortcut: { borderRadius: 12, padding: 14, borderWidth: 1, alignItems: "center" },
  voiceShortcutText: { fontSize: 14, fontWeight: "600" },
});
