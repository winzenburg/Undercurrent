import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/use-colors";

export type OrbState = "idle" | "speaking" | "listening" | "thinking";

interface VoiceOrbProps {
  state: OrbState;
  onPress?: () => void;
  size?: number;
}

export function VoiceOrb({ state, onPress, size = 120 }: VoiceOrbProps) {
  const colors = useColors();
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  const anim1 = useRef<Animated.CompositeAnimation | null>(null);
  const anim2 = useRef<Animated.CompositeAnimation | null>(null);
  const animGlow = useRef<Animated.CompositeAnimation | null>(null);
  const animRotate = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Stop all running animations
    anim1.current?.stop();
    anim2.current?.stop();
    animGlow.current?.stop();
    animRotate.current?.stop();

    pulse1.setValue(1);
    pulse2.setValue(1);
    pulse3.setValue(1);
    glow.setValue(0);
    rotation.setValue(0);

    if (state === "speaking") {
      // Rhythmic pulsing — like a voice waveform
      anim1.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse1, { toValue: 1.25, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(pulse1, { toValue: 1.0, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      anim2.current = Animated.loop(
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(pulse2, { toValue: 1.45, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(pulse2, { toValue: 1.0, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      animGlow.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.4, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      anim1.current.start();
      anim2.current.start();
      animGlow.current.start();
    } else if (state === "listening") {
      // Slow, breathing pulse — user is talking
      anim1.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse1, { toValue: 1.15, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(pulse1, { toValue: 0.95, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );
      animGlow.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.3, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );
      anim1.current.start();
      animGlow.current.start();
    } else if (state === "thinking") {
      // Slow rotation — processing
      animRotate.current = Animated.loop(
        Animated.timing(rotation, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
      );
      animGlow.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 0.6, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.2, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      animRotate.current.start();
      animGlow.current.start();
    }
  }, [state]);

  const orbColor = state === "listening" ? "#C9A84C"
    : state === "speaking" ? "#4A7FBF"
    : state === "thinking" ? "#7B5EA7"
    : colors.primary;

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const outerRingOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.25] });
  const midRingOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.15] });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { width: size * 2.2, height: size * 2.2 },
        pressed && { opacity: 0.85 },
      ]}
    >
      {/* Outer glow ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: size * 2.0,
            height: size * 2.0,
            borderRadius: size,
            backgroundColor: orbColor,
            opacity: outerRingOpacity,
            transform: [{ scale: pulse2 }],
          },
        ]}
      />
      {/* Mid glow ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            backgroundColor: orbColor,
            opacity: midRingOpacity,
            transform: [{ scale: pulse1 }],
          },
        ]}
      />
      {/* Core orb */}
      <Animated.View
        style={[
          styles.orb,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: orbColor,
            transform: state === "thinking" ? [{ rotate: spin }] : [{ scale: pulse3 }],
          },
        ]}
      >
        {/* Inner highlight */}
        <View
          style={[
            styles.highlight,
            {
              width: size * 0.35,
              height: size * 0.35,
              borderRadius: size * 0.175,
              top: size * 0.12,
              left: size * 0.15,
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
  },
  orb: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  highlight: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.25)",
  },
});
