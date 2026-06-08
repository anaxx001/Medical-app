import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostCard, type Post } from "@/components/PostCard";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";

interface Community { id: string; name: string; slug: string; icon: string; description?: string; }

export default function CommunityScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const supabase = createClient();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    async function fetch() {
      try {
        // @ts-ignore
        const { data: comm } = await supabase.from("communities").select("*").eq("slug", slug).single();
        if (comm) {
          setCommunity(comm as Community);
          // @ts-ignore
          const { data: postsData } = await supabase.from("posts").select(`
            id, title, content, file_url, file_type,
            is_announcement, is_pinned, upvotes, downvotes, created_at,
            author:profiles!author_id(id, username, full_name, avatar_url, profession),
            community:communities!community_id(id, name, slug, icon),
            comment_count:comments(count)
          `).eq("community_id", (comm as Community).id).order("created_at", { ascending: false }).limit(30);
          if (postsData) {
            setPosts((postsData as any[]).map((p: any) => ({
              ...p,
              comment_count: p.comment_count?.[0]?.count || 0,
              user_vote: null,
            })));
          }
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetch();
  }, [slug]);

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
      gap: 10,
    },
    communityHeader: {
      backgroundColor: colors.card,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    communityName: { fontSize: 18, fontFamily: "Outfit_700Bold", color: colors.foreground },
    communityDesc: { fontSize: 12, color: colors.mutedForeground, fontFamily: "DMSans_400Regular", marginTop: 2 },
    title: { flex: 1, fontSize: 17, fontFamily: "Outfit_700Bold", color: colors.foreground },
    list: { paddingHorizontal: 14, paddingTop: 10 },
    loading: { flex: 1, alignItems: "center", justifyContent: "center" },
    empty: { alignItems: "center", paddingTop: 40 },
    emptyText: { fontSize: 14, color: colors.mutedForeground, fontFamily: "DMSans_400Regular", marginTop: 8 },
  });

  if (loading) {
    return (
      <View style={[s.container, s.loading]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const header = community ? (
    <View style={s.communityHeader}>
      <View style={s.iconBox}>
        <Text style={{ fontSize: 26 }}>{community.icon || "💬"}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.communityName}>{community.name}</Text>
        {community.description ? <Text style={s.communityDesc} numberOfLines={2}>{community.description}</Text> : null}
      </View>
    </View>
  ) : null;

  return (
    <View style={s.container}>
      <View style={s.navBar}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={s.title} numberOfLines={1}>{community?.name || slug}</Text>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} currentUserId={user?.id} />}
        contentContainerStyle={[s.list, { paddingBottom: 30 }]}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="newspaper-outline" size={40} color={colors.border} />
            <Text style={s.emptyText}>No posts in this community</Text>
          </View>
        }
      />
    </View>
  );
}
