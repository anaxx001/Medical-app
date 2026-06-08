import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { createClient } from "@/lib/supabase";
import { Avatar } from "./Avatar";

export interface Post {
  id: string;
  title: string;
  content?: string;
  file_url?: string;
  file_type?: string;
  is_announcement: boolean;
  is_pinned: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
  author: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
    profession?: string;
  };
  community: {
    id: string;
    name: string;
    slug: string;
    icon: string;
  };
  comment_count?: number;
  user_vote?: "up" | "down" | null;
}

interface Props {
  post: Post;
  currentUserId?: string;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return "now";
}

export function PostCard({ post, currentUserId }: Props) {
  const colors = useColors();
  const supabase = createClient();
  const [votes, setVotes] = useState(post.upvotes - post.downvotes);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(post.user_vote || null);

  async function handleVote(type: "up" | "down") {
    if (!currentUserId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (userVote === type) {
      // @ts-ignore
      await supabase.from("post_votes").delete().match({ post_id: post.id, user_id: currentUserId });
      setVotes((v) => (type === "up" ? v - 1 : v + 1));
      setUserVote(null);
    } else {
      if (userVote) {
        // @ts-ignore
        await supabase.from("post_votes").delete().match({ post_id: post.id, user_id: currentUserId });
        setVotes((v) => (userVote === "up" ? v - 1 : v + 1));
      }
      // @ts-ignore
      await supabase.from("post_votes").insert({ post_id: post.id, user_id: currentUserId, vote_type: type });
      setVotes((v) => (type === "up" ? v + 1 : v - 1));
      setUserVote(type);
    }
  }

  const s = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    announcementCard: {
      borderColor: colors.primary,
      borderLeftWidth: 3,
    },
    header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    meta: { flex: 1 },
    community: {
      fontSize: 11,
      color: colors.primary,
      fontFamily: "DMSans_500Medium",
      fontWeight: "500" as const,
      marginBottom: 1,
    },
    authorRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    author: { fontSize: 12, color: colors.textMuted, fontFamily: "DMSans_400Regular" },
    time: { fontSize: 11, color: colors.textLight, fontFamily: "DMSans_400Regular" },
    title: {
      fontSize: 15,
      fontWeight: "700" as const,
      fontFamily: "Outfit_700Bold",
      color: colors.foreground,
      marginBottom: 6,
      lineHeight: 20,
    },
    content: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: "DMSans_400Regular",
      lineHeight: 18,
      marginBottom: 10,
    },
    footer: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 4 },
    voteRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    voteCount: {
      fontSize: 13,
      fontFamily: "DMSans_500Medium",
      fontWeight: "500" as const,
      minWidth: 20,
    },
    action: { flexDirection: "row", alignItems: "center", gap: 4 },
    actionText: { fontSize: 12, color: colors.textMuted, fontFamily: "DMSans_400Regular" },
    badge: {
      backgroundColor: colors.primary,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: 2,
    },
    badgeText: { color: "#fff", fontSize: 10, fontFamily: "Outfit_700Bold", fontWeight: "700" as const },
    pinnedBadge: {
      backgroundColor: colors.accent,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
  });

  return (
    <Pressable
      style={[s.card, post.is_announcement && s.announcementCard]}
      onPress={() => router.push(`/post/${post.id}` as any)}
    >
      <View style={s.header}>
        <Avatar
          uri={post.author.avatar_url}
          name={post.author.full_name || post.author.username}
          size={34}
        />
        <View style={s.meta}>
          <Text style={s.community}>
            {post.community?.icon} {post.community?.name}
          </Text>
          <View style={s.authorRow}>
            <Text style={s.author}>@{post.author.username}</Text>
            <Text style={s.time}>· {timeAgo(post.created_at)}</Text>
          </View>
        </View>
        {post.is_announcement && (
          <View style={s.badge}>
            <Text style={s.badgeText}>ANN</Text>
          </View>
        )}
        {post.is_pinned && !post.is_announcement && (
          <View style={s.pinnedBadge}>
            <Text style={[s.badgeText, { color: "#fff" }]}>PIN</Text>
          </View>
        )}
      </View>

      <Text style={s.title} numberOfLines={2}>{post.title}</Text>
      {post.content ? (
        <Text style={s.content} numberOfLines={3}>{post.content}</Text>
      ) : null}

      <View style={s.footer}>
        <View style={s.voteRow}>
          <Pressable onPress={() => handleVote("up")}>
            <Ionicons
              name={userVote === "up" ? "arrow-up-circle" : "arrow-up-circle-outline"}
              size={20}
              color={userVote === "up" ? colors.primary : colors.textMuted}
            />
          </Pressable>
          <Text style={[s.voteCount, { color: userVote === "up" ? colors.primary : userVote === "down" ? colors.destructive : colors.textMuted }]}>
            {votes}
          </Text>
          <Pressable onPress={() => handleVote("down")}>
            <Ionicons
              name={userVote === "down" ? "arrow-down-circle" : "arrow-down-circle-outline"}
              size={20}
              color={userVote === "down" ? colors.destructive : colors.textMuted}
            />
          </Pressable>
        </View>
        <Pressable style={s.action} onPress={() => router.push(`/post/${post.id}` as any)}>
          <Feather name="message-circle" size={15} color={colors.textMuted} />
          <Text style={s.actionText}>{post.comment_count ?? 0}</Text>
        </Pressable>
        <Pressable style={s.action}>
          <Feather name="share-2" size={15} color={colors.textMuted} />
        </Pressable>
      </View>
    </Pressable>
  );
}
