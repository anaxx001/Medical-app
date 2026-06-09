import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { fileCategory, categoryIcon } from "@/lib/storage";

interface Props {
  url: string;
  mimeType?: string;
  fileName?: string;
  compact?: boolean;
}

export function FileAttachment({ url, mimeType, fileName, compact = false }: Props) {
  const colors = useColors();
  const cat = fileCategory(mimeType);
  const icon = categoryIcon(cat);
  const label = fileName || (cat === "image" ? "Image" : cat === "pdf" ? "PDF" : "File");

  async function open() {
    await WebBrowser.openBrowserAsync(url);
  }

  if (cat === "image" && !compact) {
    return (
      <Pressable onPress={open} style={styles.imageWrap}>
        <Image
          source={{ uri: url }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={[styles.imageOverlay, { backgroundColor: "rgba(0,0,0,0.45)" }]}>
          <Feather name="external-link" size={16} color="#fff" />
          <Text style={styles.imageLabel}>View full image</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={open}
      style={[
        styles.chip,
        {
          backgroundColor: colors.secondary,
          borderColor: colors.border,
        },
        compact && styles.chipCompact,
      ]}
    >
      <Text style={styles.chipIcon}>{icon}</Text>
      <Text
        style={[styles.chipLabel, { color: colors.foreground }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Feather name="download" size={13} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  imageWrap: {
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 8,
    height: 180,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  imageLabel: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  chipCompact: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 6,
  },
  chipIcon: { fontSize: 14 },
  chipLabel: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    maxWidth: 180,
  },
});
