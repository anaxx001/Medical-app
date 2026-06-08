import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostCard, type Post } from "@/components/PostCard";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";

type Filter = "hot" | "new" | "top";

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const supabase = createClient();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("hot");
  const [search, setSearch] = useState("");

  const fetchPosts = useCallback(async () => {
    try {
      // @ts-ignore
      let query = supabase.from("posts").select(`
        id, title, content, file_url, file_type,
        is_announcement, is_pinned, upvotes, downvotes, created_at,
        author:profiles!author_id(id, username, full_name, avatar_url, profession),
        community:communities!community_id(id, name, slug, icon),
        comment_count:comments(count)
      `);

      if (filter === "new") {
        query = query.order("created_at", { ascending: false });
      } else if (filter === "top") {
        query = query.order("upvotes", { ascending: false });
      } else {
        query = query
          .order("is_announcement", { ascending: false })
          .order("is_pinned", { ascending: false })
          .order("upvotes", { ascending: false })
          .order("created_at", { ascending: false });
      }

      const { data, error } = await query.limit(30);
      if (error) throw error;

      const votesMap: Record<string, "up" | "down"> = {};
      if (user?.id && data?.length) {
        // @ts-ignore
        const { data: votes } = await supabase
          .from("post_votes")
          .select("post_id, vote_type")
          // @ts-ignore
          .in("post_id", (data as any[]).map((p: any) => p.id));
        if (votes) {
          (votes as any[]).forEach((v: any) => { votesMap[v.post_id] = v.vote_type; });
        }
      }

      setPosts(
        ((data || []) as any[]).map((p: any) => ({
          ...p,
          comment_count: p.comment_count?.[0]?.count || 0,
          user_vote: votesMap[p.id] || null,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, user?.id]);

  useEffect(() => {
    setLoading(true);
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const displayed = search
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          (p.content?.toLowerCase() || "").includes(search.toLowerCase())
      )
    : posts;

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPadding + 8,
      paddingHorizontal: 16,
      paddingBottom: 8,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    logo: {
      fontSize: 22,
      fontFamily: "Outfit_700Bold",
      color: colors.primary,
    },
    logoAccent: { color: colors.accent },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface2,
      borderRadius: 50,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.foreground,
      fontFamily: "DMSans_400Regular",
    },
    filters: { flexDirection: "row", gap: 8 },
    filterBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 50,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { fontSize: 13, fontFamily: "DMSans_500Medium", color: colors.mutedForeground },
    filterTextActive: { color: "#fff" },
    list: { paddingHorizontal: 14, paddingTop: 10 },
    loading: { flex: 1, alignItems: "center", justifyContent: "center" },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
    emptyText: { fontSize: 15, color: colors.mutedForeground, fontFamily: "DMSans_400Regular", marginTop: 12 },
  });

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "hot", label: "Hot" },
    { key: "new", label: "New" },
    { key: "top", label: "Top" },
  ];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.headerRow}>
          <Text style={s.logo}>
            Med<Text style={s.logoAccent}>Student</Text>
          </Text>
          <Pressable onPress={() => router.push("/create" as any)}>
            <Feather name="edit" size={22} color={colors.primary} />
          </Pressable>
        </View>
        <View style={s.searchBar}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={s.searchInput}
            placeholder="Search posts..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
        <View style={s.filters}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              style={[s.filterBtn, filter === f.key && s.filterBtnActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={s.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} currentUserId={user?.id} />}
          contentContainerStyle={[s.list, { paddingBottom: 100 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="newspaper-outline" size={48} color={colors.border} />
              <Text style={s.emptyText}>No posts yet</Text>
            </View>
          }
          scrollEnabled={!!displayed.length}
        />
      )}
    </View>
  );
}
