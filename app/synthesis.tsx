import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function SynthesisScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();

  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [synthesisData, setSynthesisData] = useState<Record<string, string>>({});
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const generateSynthesisMutation = trpc.interview.generateSynthesis.useMutation();
  const sendEmailMutation = trpc.interview.sendEmail.useMutation();
  const getSessionQuery = trpc.interview.getSession.useQuery();

  useEffect(() => {
    // Generate synthesis on mount
    generateSynthesisMutation.mutateAsync().then((result) => {
      // result is a Record<string, string> with hedgehog_overlap, zone_of_genius, etc.
      const parts: string[] = [];
      if (result.hedgehog_overlap) parts.push(`**The Hedgehog Overlap**\n${result.hedgehog_overlap}`);
      if (result.zone_of_genius) parts.push(`**Your Zone of Genius**\n${result.zone_of_genius}`);
      if (result.ikigai_sweet_spot) parts.push(`**Your Ikigai Sweet Spot**\n${result.ikigai_sweet_spot}`);
      if (result.energy_patterns_positive) parts.push(`**What Gives You Energy**\n${result.energy_patterns_positive}`);
      if (result.energy_patterns_draining) parts.push(`**What Drains You**\n${result.energy_patterns_draining}`);
      if (result.key_insight) parts.push(`**Key Insight**\n${result.key_insight}`);
      setSynthesis(parts.join("\n\n"));
      setSynthesisData(result);
    }).catch((e) => {
      console.error("[Synthesis] Failed:", e);
      setSynthesis("We encountered an issue generating your synthesis. Your answers have been saved — please try again.");
    });
  }, []);

  const handleSendEmail = async () => {
    if (!user?.email || emailSent) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSendingEmail(true);
    setEmailError(null);
    const session = getSessionQuery.data?.session;
    try {
      await sendEmailMutation.mutateAsync({
        synthesis: synthesisData,
        careerCanvas: (session?.careerCanvas as Record<string, string>) ?? {},
        nextSteps: (session?.nextSteps as Array<{ action: string; deadline: string }>) ?? [],
        odysseyPaths: (session?.odysseyPaths as { path_a: string; path_b: string; path_c: string }) ?? { path_a: "", path_b: "", path_c: "" },
        odysseyRatings: (session?.odysseyRatings as Record<string, Record<string, number>>) ?? {},
      });
      setEmailSent(true);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setEmailError("Failed to send email. Please try again.");
    } finally {
      setSendingEmail(false);
    }
  };

  const isLoading = generateSynthesisMutation.isPending;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={[styles.headerIcon, { backgroundColor: colors.accent }]}>
          <Text style={styles.headerIconText}>✦</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.foreground }]}>Your Synthesis</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Based on your full discovery conversation
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Weaving your insights together...
            </Text>
            <Text style={[styles.loadingSubtext, { color: colors.muted }]}>
              This takes about 30 seconds
            </Text>
          </View>
        ) : synthesis ? (
          <>
            {/* Synthesis content */}
            <View style={[styles.synthesisCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.synthesisText, { color: colors.foreground }]}>
                {synthesis}
              </Text>
            </View>

            {/* Email delivery */}
            <View style={[styles.emailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emailTitle, { color: colors.foreground }]}>
                Get this in your inbox
              </Text>
              <Text style={[styles.emailDesc, { color: colors.muted }]}>
                We'll send your full synthesis report to{" "}
                <Text style={{ color: colors.accent, fontWeight: "600" }}>{user?.email ?? "your email"}</Text>
              </Text>

              {emailSent ? (
                <View style={[styles.emailSentBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.emailSentText}>✓ Report sent to your inbox</Text>
                </View>
              ) : (
                <>
                  <Pressable
                    onPress={handleSendEmail}
                    style={({ pressed }) => [
                      styles.emailBtn,
                      { backgroundColor: colors.accent },
                      pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                      sendingEmail && { opacity: 0.6 },
                    ]}
                    disabled={sendingEmail}
                  >
                    {sendingEmail ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={[styles.emailBtnText, { color: colors.primary }]}>
                        Send My Report
                      </Text>
                    )}
                  </Pressable>
                  {emailError && (
                    <Text style={[styles.emailError, { color: colors.error }]}>{emailError}</Text>
                  )}
                </>
              )}
            </View>

            {/* What's next */}
            <View style={[styles.nextCard, { backgroundColor: colors.sectionBg }]}>
              <Text style={[styles.nextTitle, { color: colors.foreground }]}>What now?</Text>
              <Text style={[styles.nextText, { color: colors.muted }]}>
                Your synthesis is a starting point, not a prescription. Sit with it. Share it with someone you trust. Notice what resonates — and what doesn't.{"\n\n"}
                The undercurrent was always there. Now you can feel it.
              </Text>
            </View>

            {/* Restart */}
            <Pressable
              onPress={() => router.replace("/(tabs)")}
              style={({ pressed }) => [
                styles.homeBtn,
                { borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.homeBtnText, { color: colors.muted }]}>
                Return to Home
              </Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    gap: 14,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconText: {
    fontSize: 20,
    color: "#1B2A4A",
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 48,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  loadingSubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  synthesisCard: {
    borderRadius: 16,
    padding: 20,
  },
  synthesisText: {
    fontSize: 15,
    lineHeight: 24,
  },
  emailCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  emailTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  emailDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  emailBtn: {
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
  },
  emailBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  emailSentBadge: {
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  emailSentText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  emailError: {
    fontSize: 13,
    textAlign: "center",
  },
  nextCard: {
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  nextTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  nextText: {
    fontSize: 15,
    lineHeight: 23,
  },
  homeBtn: {
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  homeBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
