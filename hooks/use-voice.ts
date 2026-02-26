import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useAudioPlayer, useAudioRecorder, AudioModule, RecordingPresets } from "expo-audio";
import { trpc } from "@/lib/trpc";
import { getSelectedVoice } from "@/lib/voice-store";
import * as FileSystem from "expo-file-system/legacy";

export type VoiceState = "idle" | "speaking" | "listening" | "thinking";

interface UseVoiceOptions {
  onTranscription?: (text: string) => void;
  onError?: (error: string) => void;
}

export function useVoice({ onTranscription, onError }: UseVoiceOptions = {}) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [currentAudioBase64, setCurrentAudioBase64] = useState<string | null>(null);

  const player = useAudioPlayer(undefined);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const isPlayingRef = useRef(false);
  const stopRequestedRef = useRef(false);

  const speakMutation = trpc.interview.speakText.useMutation();
  const transcribeMutation = trpc.interview.transcribeVoice.useMutation();

  // Request microphone permission on mount
  useEffect(() => {
    AudioModule.requestRecordingPermissionsAsync().then((status) => {
      setHasPermission(status.granted);
    });
  }, []);

  // Speak text using ElevenLabs via server
  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      stopRequestedRef.current = false;
      setVoiceState("thinking");

      try {
        const voice = await getSelectedVoice();
        const result = await speakMutation.mutateAsync({ text, voiceId: voice.voice_id });
        if (!result.audioBase64 || stopRequestedRef.current) {
          setVoiceState("idle");
          return;
        }

        setCurrentAudioBase64(result.audioBase64);
        setVoiceState("speaking");
        isPlayingRef.current = true;

        if (Platform.OS === "web") {
          // Web: decode base64 and play via Audio API
          const binary = atob(result.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: "audio/mpeg" });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => {
            URL.revokeObjectURL(url);
            isPlayingRef.current = false;
            if (!stopRequestedRef.current) setVoiceState("idle");
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            isPlayingRef.current = false;
            setVoiceState("idle");
          };
          await audio.play();
        } else {
          // Native: write to temp file and play
          const tmpPath = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
          await FileSystem.writeAsStringAsync(tmpPath, result.audioBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          player.replace({ uri: tmpPath });
          player.play();

          // Poll for completion
          const checkDone = setInterval(() => {
            if (stopRequestedRef.current || !player.playing) {
              clearInterval(checkDone);
              isPlayingRef.current = false;
              if (!stopRequestedRef.current) setVoiceState("idle");
            }
          }, 300);
        }
      } catch (err) {
        console.error("[Voice] speak error:", err);
        setVoiceState("idle");
        onError?.("Failed to generate speech. Check your connection.");
      }
    },
    [speakMutation, player, onError]
  );

  // Stop speaking immediately
  const stopSpeaking = useCallback(() => {
    stopRequestedRef.current = true;
    isPlayingRef.current = false;
    if (Platform.OS !== "web") {
      try { player.pause(); } catch { /* ignore */ }
    }
    setVoiceState("idle");
  }, [player]);

  // Start recording user's voice
  const startRecording = useCallback(async () => {
    if (!hasPermission) {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        onError?.("Microphone permission is required to use voice input.");
        return;
      }
      setHasPermission(true);
    }

    // Stop any playing audio first
    stopSpeaking();

    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
      setVoiceState("listening");
    } catch (err) {
      console.error("[Voice] startRecording error:", err);
      onError?.("Could not start recording. Please try again.");
    }
  }, [hasPermission, recorder, stopSpeaking, onError]);

  // Stop recording and transcribe
  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!isRecording) return null;

    setVoiceState("thinking");
    setIsRecording(false);

    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        setVoiceState("idle");
        return null;
      }

      // Read the audio file as base64
      let audioBase64: string;
      if (Platform.OS === "web") {
        // On web, fetch the blob URL and convert
        const response = await fetch(uri);
        const blob = await response.blob();
        audioBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1] ?? "");
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        audioBase64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      const mimeType = Platform.OS === "web" ? "audio/webm" : "audio/m4a";
      const result = await transcribeMutation.mutateAsync({ audioBase64, mimeType });
      const text = result.text?.trim() ?? "";

      setVoiceState("idle");
      if (text) onTranscription?.(text);
      return text || null;
    } catch (err) {
      console.error("[Voice] stopRecording error:", err);
      setVoiceState("idle");
      onError?.("Could not transcribe audio. Please try typing your answer.");
      return null;
    }
  }, [isRecording, recorder, transcribeMutation, onTranscription, onError]);

  // Cleanup
  useEffect(() => {
    return () => {
      try { recorder.stop(); } catch { /* ignore */ }
    };
  }, []);

  return {
    voiceState,
    isRecording,
    hasPermission,
    speak,
    stopSpeaking,
    startRecording,
    stopRecording,
    isSpeaking: voiceState === "speaking",
    isListening: voiceState === "listening",
    isThinking: voiceState === "thinking",
  };
}
