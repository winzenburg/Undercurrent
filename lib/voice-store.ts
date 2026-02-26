import AsyncStorage from "@react-native-async-storage/async-storage";

const VOICE_KEY = "undercurrent_selected_voice";

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  description: string;
  preview_url?: string;
}

// Top 5 curated ElevenLabs voices for a warm, coaching-style conversation
export const CURATED_VOICES: ElevenLabsVoice[] = [
  {
    voice_id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    description: "Calm, warm, and clear. Great for coaching.",
  },
  {
    voice_id: "AZnzlk1XvdvUeBnXmlld",
    name: "Domi",
    description: "Strong and confident. Direct and motivating.",
  },
  {
    voice_id: "EXAVITQu4vr4xnSDxMaL",
    name: "Bella",
    description: "Soft and empathetic. Gentle and supportive.",
  },
  {
    voice_id: "ErXwobaYiN019PkySvjV",
    name: "Antoni",
    description: "Warm and well-rounded. Thoughtful and grounded.",
  },
  {
    voice_id: "VR6AewLTigWG4xSOukaG",
    name: "Arnold",
    description: "Crisp and authoritative. Clear and decisive.",
  },
];

export async function getSelectedVoice(): Promise<ElevenLabsVoice> {
  try {
    const stored = await AsyncStorage.getItem(VOICE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ElevenLabsVoice;
      // Validate it's still in our list
      const found = CURATED_VOICES.find((v) => v.voice_id === parsed.voice_id);
      if (found) return found;
    }
  } catch {
    // ignore
  }
  return CURATED_VOICES[0]; // default: Rachel
}

export async function setSelectedVoice(voice: ElevenLabsVoice): Promise<void> {
  await AsyncStorage.setItem(VOICE_KEY, JSON.stringify(voice));
}
