import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  const colors = useColors();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function PostCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.meta}>
        <SkeletonBox width={28} height={28} borderRadius={14} />
        <SkeletonBox width={120} height={12} />
      </View>
      <SkeletonBox width="90%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonBox width="60%" height={14} style={{ marginBottom: 12 }} />
      <SkeletonBox width="100%" height={12} style={{ marginBottom: 4 }} />
      <SkeletonBox width="80%" height={12} style={{ marginBottom: 14 }} />
      <View style={styles.actions}>
        <SkeletonBox width={60} height={28} borderRadius={50} />
        <SkeletonBox width={60} height={28} borderRadius={50} />
        <SkeletonBox width={60} height={28} borderRadius={50} />
      </View>
    </View>
  );
}

export function CommunityItemSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.communityItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SkeletonBox width={44} height={44} borderRadius={12} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBox width="55%" height={14} />
        <SkeletonBox width="75%" height={11} />
      </View>
    </View>
  );
}

export function ProfileHeaderSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.profileHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SkeletonBox width={72} height={72} borderRadius={36} style={{ alignSelf: "center" }} />
      <SkeletonBox width={140} height={18} style={{ alignSelf: "center", marginTop: 12 }} />
      <SkeletonBox width={100} height={12} style={{ alignSelf: "center", marginTop: 6 }} />
      <SkeletonBox width={80} height={24} borderRadius={50} style={{ alignSelf: "center", marginTop: 8 }} />
    </View>
  );
}

export function CommentSkeleton() {
  return (
    <View style={styles.commentRow}>
      <SkeletonBox width={32} height={32} borderRadius={16} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBox width="40%" height={12} />
        <SkeletonBox width="90%" height={12} />
        <SkeletonBox width="65%" height={12} />
      </View>
    </View>
  );
}

export function TypingIndicator() {
  const colors = useColors();
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
    const a1 = bounce(dot1, 0);
    const a2 = bounce(dot2, 150);
    const a3 = bounce(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  const dotStyle = {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, padding: 4 }}>
      <Animated.View style={[dotStyle, { transform: [{ translateY: dot1 }] }]} />
      <Animated.View style={[dotStyle, { transform: [{ translateY: dot2 }] }]} />
      <Animated.View style={[dotStyle, { transform: [{ translateY: dot3 }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 6,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  communityItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 12,
  },
  profileHeader: {
    padding: 20,
    borderBottomWidth: 1,
  },
  commentRow: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
});
