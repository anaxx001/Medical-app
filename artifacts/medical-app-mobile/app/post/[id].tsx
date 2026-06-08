import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/Avatar";
import { PostCard, type Post } from "@/components/PostCard";
import { PostCardSkeleton, CommentSkeleton } from "@/components/Skeleton";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { notifyReply } from "@/lib/api";


interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: { id: string; username: string; full_name: string; avatar_url?: string; profession?: string };
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();
  const supabase = createClient();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetch() {
      try {
        const [{ data: postData }, { data: commentData }] = await Promise.all([
          // @ts-ignore
          supabase.from("posts").select(`
            id, title, content, file_url, file_type,
            is_announcement, is_pinned, upvotes, downvotes, created_at,
            author:profiles!author_id(id, username, full_name, avatar_url, profession),
            community:communities!community_id(id, name, slug, icon),
            comment_count:comments(count)
          `).eq("id", id).single(),
          // @ts-ignore
          supabase.from("comments").select(`
            id, content, created_at,
            author:profiles!author_id(id, username, full_name, avatar_url, profession)
          `).eq("post_id", id).order("created_at", { ascending: true }),
        ]);
        if (postData) setPost({ ...(postData as any), comment_count: (postData as any).comment_count?.[0]?.count || 0 });
        if (commentData) setComments(commentData as Comment[]);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetch();
  }, [id]);

  async function submitComment() {
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { data, error } = await (supabase as any).from("comments").insert({
        post_id: id,
        author_id: user.id,
        content: newComment.trim(),
      }).select(`id, content, created_at, author:profiles!author_id(id, username, full_name, avatar_url, profession)`).single();
      if (error) throw error;
      setComments((prev) => [...prev, data as unknown as Comment]);
      setNewComment("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const newCommentId = (data as any)?.id;
      if (newCommentId && session?.access_token) {
        notifyReply({
          commentId: newCommentId,
          commenterName: (data as any)?.author?.username ?? user.email ?? "Someone",
          postTitle: post?.title,
          postId: id!,
          authToken: session.access_token,
        });
      }
    } catch (e) { console.error(e); } finally { setSubmitting(false); }
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    navBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: insets.top + 8,
      paddingHorizontal: 16,
      paddingBottom: 10,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    navTitle: { flex: 1, fontSize: 16, fontFamily: "Outfit_700Bold", color: colors.foreground, textAlign: "center" },
    loading: { flex: 1, alignItems: "center", justifyContent: "center" },
    commentCard: {
      flexDirection: "row",
      gap: 10,
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    commentBody: { flex: 1 },
    commentMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
    commentAuthor: { fontSize: 13, fontFamily: "DMSans_500Medium", color: colors.foreground },
    commentTime: { fontSize: 11, color: colors.mutedForeground, fontFamily: "DMSans_400Regular" },
    commentContent: { fontSize: 14, color: colors.foreground, fontFamily: "DMSans_400Regular", lineHeight: 20 },
    sectionLabel: {
      fontSize: 12,
      fontFamily: "Outfit_700Bold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      padding: 14,
      paddingBottom: 6,
    },
    inputArea: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      padding: 12,
      paddingBottom: insets.bottom + 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    inputWrap: {
      flex: 1,
      backgroundColor: colors.surface2,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      maxHeight: 80,
    },
    input: { fontSize: 14, color: colors.foreground, fontFamily: "DMSans_400Regular" },
    sendBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendDisabled: { opacity: 0.4 },
  });

  return (
    <View style={s.container}>
      <View style={s.navBar}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={s.navTitle}>Post</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={{ padding: 14 }}>
          <PostCardSkeleton />
          <CommentSkeleton />
          <CommentSkeleton />
          <CommentSkeleton />
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 10 }}
            ListHeaderComponent={
              post ? (
                <>
                  <View style={{ padding: 14 }}>
                    <PostCard post={post} currentUserId={user?.id} />
                  </View>
                  <Text style={s.sectionLabel}>
                    {comments.length} Comment{comments.length !== 1 ? "s" : ""}
                  </Text>
                </>
              ) : null
            }
            renderItem={({ item }) => (
              <View style={s.commentCard}>
                <Avatar uri={item.author.avatar_url} name={item.author.full_name || item.author.username} size={32} />
                <View style={s.commentBody}>
                  <View style={s.commentMeta}>
                    <Text style={s.commentAuthor}>@{item.author.username}</Text>
                    <Text style={s.commentTime}>{timeAgo(item.created_at)}</Text>
                  </View>
                  <Text style={s.commentContent}>{item.content}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingVertical: 30 }}>
                <Feather name="message-circle" size={32} color={colors.border} />
                <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 8, fontFamily: "DMSans_400Regular" }}>
                  No comments yet. Be first!
                </Text>
              </View>
            }
          />
          {user ? (
            <View style={s.inputArea}>
              <Avatar uri={undefined} name={user.email || "U"} size={32} />
              <TextInput
                style={[s.inputWrap, s.input]}
                placeholder="Add a comment..."
                placeholderTextColor={colors.mutedForeground}
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <Pressable
                style={[s.sendBtn, (!newComment.trim() || submitting) && s.sendDisabled]}
                onPress={submitComment}
                disabled={!newComment.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather name="send" size={16} color="#fff" />
                )}
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={{ margin: 14, backgroundColor: colors.secondary, borderRadius: 12, padding: 14, alignItems: "center" }}
              onPress={() => router.push("/login" as any)}
            >
              <Text style={{ fontSize: 14, color: colors.primary, fontFamily: "DMSans_500Medium" }}>
                Sign in to comment
              </Text>
            </Pressable>
          )}
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
