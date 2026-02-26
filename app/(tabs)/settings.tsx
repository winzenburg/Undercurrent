import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
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
import { CURATED_VOICES, ElevenLabsVoice, getSelectedVoice, setSelectedVoice } from "@/lib/voice-store";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [selectedVoice, setSelected] = useState<ElevenLabsVoice>(CURATED_VOICES[0]);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const speakMutation = trpc.interview.speakText.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  useEffect(() => {
    getSelectedVoice().then(setSelected);
  }, []);

  const handleSelectVoice = async (voice: ElevenLabsVoice) => {
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
          // On native, just show selection feedback
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

  const handleLogout = () => {
    if (Platform.OS === "web") {
      logoutMutation.mutate(undefined, {
        onSuccess: () => router.replace("/welcome"),
      });
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            logoutMutation.mutate(undefined, {
              onSuccess: () => router.replace("/welcome"),
            });
          },
        },
      ]);
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        </View>

        {/* Profile card */}
        {user && (
          <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {(user.name ?? user.email ?? "U")[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.foreground }]}>
                {user.name ?? "Your Account"}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.muted }]}>
                {user.email ?? ""}
              </Text>
            </View>
          </View>
        )}

        {/* Voice section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>AI COACH VOICE</Text>
          <Text style={[styles.sectionDesc, { color: colors.muted }]}>
            Your coach will speak every question and response aloud using this voice.
          </Text>

          <View style={styles.voiceList}>
            {CURATED_VOICES.map((voice) => {
              const isSelected = selectedVoice.voice_id === voice.voice_id;
              const isPreviewing = previewingId === voice.voice_id;

              return (
                <Pressable
                  key={voice.voice_id}
                  onPress={() => handleSelectVoice(voice)}
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
                  <View style={styles.voiceLeft}>
                    <View style={[styles.voiceInitial, { backgroundColor: isSelected ? colors.accent : colors.border }]}>
                      <Text style={[styles.voiceInitialText, { color: isSelected ? colors.primary : colors.muted }]}>
                        {voice.name[0]}
                      </Text>
                    </View>
                    <View style={styles.voiceText}>
                      <View style={styles.voiceNameRow}>
                        <Text style={[styles.voiceName, { color: isSelected ? "#fff" : colors.foreground }]}>
                          {voice.name}
                        </Text>
                        {isSelected && (
                          <View style={[styles.defaultBadge, { backgroundColor: colors.accent }]}>
                            <Text style={[styles.defaultBadgeText, { color: colors.primary }]}>Active</Text>
                          </View>
                        )}
                      </View>
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
                        backgroundColor: isSelected ? "rgba(255,255,255,0.15)" : colors.background,
                        borderColor: isSelected ? "rgba(255,255,255,0.3)" : colors.border,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    {isPreviewing && isPlaying ? (
                      <ActivityIndicator size="small" color={isSelected ? "#fff" : colors.accent} />
                    ) : (
                      <Text style={[styles.previewText, { color: isSelected ? "#fff" : colors.accent }]}>
                        Preview
                      </Text>
                    )}
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* About section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>ABOUT</Text>
          <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: colors.muted }]}>App</Text>
              <Text style={[styles.aboutValue, { color: colors.foreground }]}>Undercurrent</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: colors.muted }]}>Version</Text>
              <Text style={[styles.aboutValue, { color: colors.foreground }]}>1.0.0</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: colors.muted }]}>Frameworks</Text>
              <Text style={[styles.aboutValue, { color: colors.foreground }]}>6 integrated</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: colors.muted }]}>Questions</Text>
              <Text style={[styles.aboutValue, { color: colors.foreground }]}>19 total</Text>
            </View>
          </View>
        </View>

        {/* Sign out */}
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.signOutBtn,
            { borderColor: colors.error, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48, gap: 24 },
  header: { paddingTop: 8 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.4 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "800" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  profileEmail: { fontSize: 13 },
  section: { gap: 12 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.08 },
  sectionDesc: { fontSize: 13, lineHeight: 18, marginTop: -4 },
  voiceList: { gap: 10 },
  voiceCard: {
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  voiceLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  voiceInitial: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceInitialText: { fontSize: 17, fontWeight: "700" },
  voiceText: { flex: 1 },
  voiceNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  voiceName: { fontSize: 15, fontWeight: "700" },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  defaultBadgeText: { fontSize: 10, fontWeight: "700" },
  voiceDesc: { fontSize: 12, lineHeight: 16 },
  previewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 68,
    alignItems: "center",
    justifyContent: "center",
  },
  previewText: { fontSize: 12, fontWeight: "600" },
  aboutCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  aboutLabel: { fontSize: 14 },
  aboutValue: { fontSize: 14, fontWeight: "600" },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  signOutBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: { fontSize: 15, fontWeight: "700" },
});
