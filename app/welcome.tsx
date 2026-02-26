import { useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { Pressable } from "react-native";
import { startOAuthLogin } from "@/constants/oauth";
import { useEffect } from "react";

const FRAMEWORKS = [
  { name: "Hedgehog Concept", color: "#C9A84C" },
  { name: "Ikigai", color: "#E8734A" },
  { name: "Design Your Life", color: "#4A9E8A" },
  { name: "Zone of Genius", color: "#7B5EA7" },
  { name: "StrengthsFinder", color: "#4A7FBF" },
  { name: "Career Canvas", color: "#2D9E6B" },
];

export default function WelcomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, loading]);

  const handleGetStarted = async () => {
    await startOAuthLogin();
  };

  return (
    <ScreenContainer containerClassName="bg-primary" safeAreaClassName="bg-primary" edges={["top", "left", "right", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.logoMark, { backgroundColor: colors.accent }]}>
            <Text style={styles.logoChar}>U</Text>
          </View>
          <Text style={[styles.appName, { color: colors.accent }]}>Undercurrent</Text>
          <Text style={styles.tagline}>
            Discover what's already pulling you forward.
          </Text>
        </View>

        {/* Context card */}
        <View style={[styles.card, { backgroundColor: "rgba(255,255,255,0.07)" }]}>
          <Text style={styles.cardHeading}>For the moment of "what now?"</Text>
          <Text style={styles.cardBody}>
            Whether you've just been laid off, are burning out, or quietly wondering if AI is about to make your skills obsolete — this is a space to think clearly about what comes next.
          </Text>
          <Text style={[styles.cardBody, { marginTop: 12 }]}>
            Undercurrent is a guided career discovery interview. Not a quiz. Not a personality test. A real conversation — powered by a voice AI coach — that helps you surface what you already know about yourself.
          </Text>
        </View>

        {/* What it covers */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>6 FRAMEWORKS, 19 QUESTIONS</Text>
          <View style={styles.frameworkGrid}>
            {FRAMEWORKS.map((f) => (
              <View key={f.name} style={[styles.frameworkPill, { borderColor: f.color }]}>
                <View style={[styles.frameworkDot, { backgroundColor: f.color }]} />
                <Text style={[styles.frameworkText, { color: "rgba(255,255,255,0.85)" }]}>{f.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
          {[
            { step: "01", text: "Choose a voice — your AI coach will speak every question aloud." },
            { step: "02", text: "Answer by talking. No typing required. Just speak naturally." },
            { step: "03", text: "The AI reflects back patterns and asks follow-up questions." },
            { step: "04", text: "At the end, receive a full synthesis report sent to your email." },
          ].map((item) => (
            <View key={item.step} style={styles.stepRow}>
              <Text style={[styles.stepNum, { color: colors.accent }]}>{item.step}</Text>
              <Text style={styles.stepText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [
              styles.ctaButton,
              { backgroundColor: colors.accent },
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={styles.ctaText}>Begin Your Discovery</Text>
          </Pressable>
          <Text style={styles.ctaNote}>Takes 45–60 minutes. Save and resume any time.</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 24,
    paddingBottom: 48,
  },
  hero: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 32,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoChar: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1B2A4A",
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 17,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardHeading: {
    fontSize: 17,
    fontWeight: "700",
    color: "rgba(255,255,255,0.95)",
    marginBottom: 10,
  },
  cardBody: {
    fontSize: 15,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 22,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.08,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 14,
  },
  frameworkGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  frameworkPill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  frameworkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  frameworkText: {
    fontSize: 13,
    fontWeight: "500",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 14,
  },
  stepNum: {
    fontSize: 13,
    fontWeight: "800",
    width: 24,
    lineHeight: 22,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 22,
  },
  ctaContainer: {
    alignItems: "center",
    paddingTop: 8,
  },
  ctaButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 32,
    marginBottom: 12,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1B2A4A",
  },
  ctaNote: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
  },
});
