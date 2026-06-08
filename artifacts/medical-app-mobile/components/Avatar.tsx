import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  uri?: string | null;
  name: string;
  size?: number;
}

export function Avatar({ uri, name, size = 36 }: Props) {
  const colors = useColors();
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    image: { width: size, height: size },
    text: {
      color: colors.primaryForeground,
      fontSize: size * 0.38,
      fontFamily: "Outfit_700Bold",
      fontWeight: "700" as const,
    },
  });

  if (uri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri }} style={styles.image} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{initials || "?"}</Text>
    </View>
  );
}
