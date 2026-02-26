// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navigation
  "house.fill": "home",
  "person.fill": "person",
  "chart.bar.fill": "bar-chart",
  "list.bullet": "format-list-bulleted",
  "checkmark.circle.fill": "check-circle",
  // Interview
  "paperplane.fill": "send",
  "mic.fill": "mic",
  "mic.slash.fill": "mic-off",
  "speaker.wave.2.fill": "volume-up",
  "stop.fill": "stop",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  // UI
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "arrow.right": "arrow-forward",
  "arrow.left": "arrow-back",
  "arrow.clockwise": "refresh",
  "ellipsis": "more-horiz",
  "star.fill": "star",
  "star": "star-border",
  "heart.fill": "favorite",
  "bolt.fill": "bolt",
  "lightbulb.fill": "lightbulb",
  "brain.head.profile": "psychology",
  "waveform": "graphic-eq",
  "envelope.fill": "email",
  "checkmark": "check",
  "lock.fill": "lock",
  "gear": "settings",
  "square.and.arrow.up": "share",
  "doc.text.fill": "description",
  "pencil": "edit",
  "trash.fill": "delete",
  "info.circle": "info",
  "questionmark.circle": "help",
  "chevron.left.forwardslash.chevron.right": "code",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
