import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { VoiceOrb } from "@/components/VoiceOrb";
import { useColors } from "@/hooks/use-colors";
import { CURATED_VOICES, ElevenLabsVoice, getSelectedVoice, setSelectedVoice } from "@/lib/voice-store";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function VoiceSelectScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selected, setSelected] = useState<ElevenLabsVoice>(CURATED_VOICES[0]);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const speakMutation = trpc.interview.speakText.useMutation();

  useEffect(() => {
    getSelectedVoice().then(setSelected);
  }, []);

  const handleSelect = async (voice: ElevenLabsVoice) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(voice);
    await setSelectedVoice(voice);
  };

  const handlePreview = async (voice: ElevenLabsVoice) => {
    if (isPlaying) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPreviewingId(voice.voice_id);
    setIsPlaying(true);

    try {
      const result = await speakMutation.mutateAsync({
        text: "Hi, I'm your career discovery coach. I'll be guiding you through this conversation today.",
        voiceId: voice.voice_id,
      });

      if (result.audioBase64) {
        if (Platform.OS === "web") {
          const binary = atob(result.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: "audio/mpeg" });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => { URL.revokeObjectURL(url); setIsPlaying(false); setPreviewingId(null); };
          audio.onerror = () => { URL.revokeObjectURL(url); setIsPlaying(false); setPreviewingId(null); };
          await audio.play();
        } else {
          // Native: use expo-av or just skip preview on native for now
          setIsPlaying(false);
          setPreviewingId(null);
        }
      } else {
        setIsPlaying(false);
        setPreviewingId(null);
      }
    } catch {
      setIsPlaying(false);
      setPreviewingId(null);
    }
  };

  const handleContinue = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setSelectedVoice(selected);
    router.replace("/(tabs)");
  };

  return (
    <ScreenContainer className="px-6 pt-8">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <VoiceOrb state="idle" size={60} />
          <Text style={[styles.title, { color: colors.foreground }]}>Choose Your Voice</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Your AI coach will speak every question and response aloud. Pick the voice that feels right for this conversation.
          </Text>
        </View>

        {/* Voice list */}
        <View style={styles.list}>
          {CURATED_VOICES.map((voice) => {
            const isSelected = selected.voice_id === voice.voice_id;
            const isPreviewing = previewingId === voice.voice_id;

            return (
              <Pressable
                key={voice.voice_id}
                onPress={() => handleSelect(voice)}
                style={({ pressed }) => [
                  styles.voiceCard,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.accent : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={styles.voiceInfo}>
                  <View style={[styles.voiceInitial, { backgroundColor: isSelected ? colors.accent : colors.border }]}>
                    <Text style={[styles.voiceInitialText, { color: isSelected ? colors.primary : colors.muted }]}>
                      {voice.name[0]}
                    </Text>
                  </View>
                  <View style={styles.voiceText}>
                    <Text style={[styles.voiceName, { color: isSelected ? "#fff" : colors.foreground }]}>
                      {voice.name}
                    </Text>
                    <Text style={[styles.voiceDesc, { color: isSelected ? "rgba(255,255,255,0.65)" : colors.muted }]}>
                      {voice.description}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => handlePreview(voice)}
                  style={({ pressed }) => [
                    styles.previewBtn,
                    {
                      backgroundColor: isSelected ? "rgba(255,255,255,0.15)" : colors.sectionBg,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  {isPreviewing && isPlaying ? (
                    <ActivityIndicator size="small" color={isSelected ? "#fff" : colors.primary} />
                  ) : (
                    <Text style={[styles.previewText, { color: isSelected ? "#fff" : colors.primary }]}>
                      Preview
                    </Text>
                  )}
                </Pressable>
              </Pressable>
            );
          })}
        </View>

        {/* Continue button */}
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.continueBtn,
            { backgroundColor: colors.accent },
            pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
          ]}
        >
          <Text style={[styles.continueBtnText, { color: colors.primary }]}>
            Start with {selected.name}
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: 32,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  list: {
    gap: 12,
    marginBottom: 32,
  },
  voiceCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  voiceInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  voiceInitial: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceInitialText: {
    fontSize: 18,
    fontWeight: "700",
  },
  voiceText: {
    flex: 1,
  },
  voiceName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  voiceDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  previewBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  previewText: {
    fontSize: 13,
    fontWeight: "600",
  },
  continueBtn: {
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: "center",
  },
  continueBtnText: {
    fontSize: 17,
    fontWeight: "700",
  },
});
