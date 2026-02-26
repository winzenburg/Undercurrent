import { useRouter } from "expo-router";
import { useState } from "react";
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
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

const CANVAS_FIELDS = [
  {
    id: "key_resources",
    label: "Key Resources",
    description: "What unique skills, knowledge, experiences, or assets do you bring?",
    placeholder: "e.g. Deep expertise in X, network in Y, ability to Z...",
    color: "#4A7FBF",
  },
  {
    id: "key_activities",
    label: "Key Activities",
    description: "What do you do that creates the most value? What energizes you most?",
    placeholder: "e.g. Building systems, coaching others, creative problem-solving...",
    color: "#7B5EA7",
  },
  {
    id: "value_proposition",
    label: "Value Proposition",
    description: "What unique value do you create for others? What problem do you solve?",
    placeholder: "e.g. I help X achieve Y by doing Z...",
    color: "#E8734A",
  },
  {
    id: "customers",
    label: "Who You Serve",
    description: "Who benefits most from what you do? Who do you most want to work with?",
    placeholder: "e.g. Early-stage founders, enterprise teams, creative professionals...",
    color: "#2D9E6B",
  },
  {
    id: "channels",
    label: "Channels",
    description: "How do you reach and deliver value to the people you serve?",
    placeholder: "e.g. Direct relationships, content, speaking, consulting...",
    color: "#C9A84C",
  },
  {
    id: "revenue_streams",
    label: "Revenue Streams",
    description: "How does value translate to income? What would you ideally be paid for?",
    placeholder: "e.g. Salary, consulting fees, products, equity...",
    color: "#4A9E8A",
  },
  {
    id: "key_partners",
    label: "Key Partners",
    description: "Who do you need to partner with or be around to do your best work?",
    placeholder: "e.g. Mentors, collaborators, communities, organizations...",
    color: "#E8734A",
  },
  {
    id: "cost_structure",
    label: "What You're Willing to Trade",
    description: "What are you willing to invest — time, energy, money, stability — to build this?",
    placeholder: "e.g. 2 years of lower income, evenings on side projects...",
    color: "#7B5EA7",
  },
];

export default function CareerCanvasScreen() {
  const colors = useColors();
  const router = useRouter();
  const [canvas, setCanvas] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const updateProgressMutation = trpc.interview.updateProgress.useMutation();

  const handleChange = (id: string, value: string) => {
    setCanvas((prev) => ({ ...prev, [id]: value }));
  };

  const filledCount = CANVAS_FIELDS.filter((f) => canvas[f.id]?.trim()).length;
  const isReady = filledCount >= 4; // require at least 4 fields

  const handleContinue = async () => {
    if (!isReady) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    try {
      await updateProgressMutation.mutateAsync({ careerCanvas: canvas });
      router.push("/synthesis" as any);
    } catch (e) {
      console.warn("[CareerCanvas] Failed to save:", e);
      router.push("/synthesis" as any);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Career Canvas</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Map the building blocks of your ideal career. Fill in what resonates — skip what doesn't.
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(filledCount / CANVAS_FIELDS.length) * 100}%`,
                  backgroundColor: colors.accent,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressLabel, { color: colors.muted }]}>
            {filledCount} of {CANVAS_FIELDS.length} filled
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {CANVAS_FIELDS.map((field) => (
            <View key={field.id} style={[styles.fieldCard, { backgroundColor: colors.surface, borderLeftColor: field.color, borderLeftWidth: 3 }]}>
              <Text style={[styles.fieldLabel, { color: field.color }]}>{field.label}</Text>
              <Text style={[styles.fieldDesc, { color: colors.muted }]}>{field.description}</Text>
              <TextInput
                value={canvas[field.id] ?? ""}
                onChangeText={(t) => handleChange(field.id, t)}
                placeholder={field.placeholder}
                placeholderTextColor={colors.muted}
                style={[
                  styles.fieldInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.foreground,
                    borderColor: canvas[field.id]?.trim() ? field.color : colors.border,
                  },
                ]}
                multiline
                maxLength={500}
              />
            </View>
          ))}

          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.continueBtn,
              { backgroundColor: isReady ? colors.accent : colors.border },
              pressed && isReady && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            disabled={!isReady || saving}
          >
            <Text style={[styles.continueBtnText, { color: isReady ? colors.primary : colors.muted }]}>
              {saving ? "Saving..." : isReady ? "Generate My Synthesis Report" : `Fill in ${4 - filledCount} more field${4 - filledCount === 1 ? "" : "s"} to continue`}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  fieldCard: {
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  fieldDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  fieldInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 72,
  },
  continueBtn: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
