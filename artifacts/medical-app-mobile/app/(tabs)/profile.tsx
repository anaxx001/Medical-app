import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostCard, type Post } from "@/components/PostCard";
import { Avatar } from "@/components/Avatar";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  profession?: string;
  bio?: string;
  created_at?: string;
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    async function fetch() {
      try {
        const [{ data: p }, { data: userPosts }] = await Promise.all([
          // @ts-ignore
          supabase.from("profiles").select("*").eq("id", user!.id).single(),
          // @ts-ignore
          supabase.from("posts").select(`
            id, title, content, file_url, file_type,
            is_announcement, is_pinned, upvotes, downvotes, created_at,
            author:profiles!author_id(id, username, full_name, avatar_url, profession),
            community:communities!community_id(id, name, slug, icon),
            comment_count:comments(count)
          `).eq("author_id", user!.id).order("created_at", { ascending: false }).limit(20),
        ]);
        if (p) setProfile(p as Profile);
        if (userPosts) {
          setPosts((userPosts as any[]).map((p: any) => ({
            ...p,
            comment_count: p.comment_count?.[0]?.count || 0,
            user_vote: null,
          })));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [user?.id]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPadding + 8,
      paddingHorizontal: 16,
      paddingBottom: 14,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: { fontSize: 22, fontFamily: "Outfit_700Bold", color: colors.foreground },
    settingsBtn: { padding: 4 },
    profileCard: {
      backgroundColor: colors.card,
      padding: 20,
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    name: { fontSize: 20, fontFamily: "Outfit_700Bold", color: colors.foreground, marginTop: 10 },
    username: { fontSize: 14, color: colors.mutedForeground, fontFamily: "DMSans_400Regular", marginTop: 2 },
    profession: {
      fontSize: 12,
      color: colors.primary,
      fontFamily: "DMSans_500Medium",
      marginTop: 4,
      backgroundColor: colors.secondary,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 50,
    },
    bio: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "DMSans_400Regular",
      textAlign: "center",
      marginTop: 8,
      lineHeight: 18,
    },
    sectionHeader: {
      fontSize: 13,
      fontFamily: "Outfit_700Bold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 6,
    },
    list: { paddingHorizontal: 14 },
    loading: { flex: 1, alignItems: "center", justifyContent: "center" },
    loginPrompt: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
    loginText: { fontSize: 16, color: colors.mutedForeground, fontFamily: "DMSans_400Regular", textAlign: "center" },
    loginBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 28,
      paddingVertical: 12,
      borderRadius: 50,
    },
    loginBtnText: { color: "#fff", fontSize: 15, fontFamily: "Outfit_700Bold" },
    empty: { alignItems: "center", paddingTop: 30 },
    emptyText: { fontSize: 14, color: colors.mutedForeground, fontFamily: "DMSans_400Regular", marginTop: 8 },
  });

  if (loading) {
    return (
      <View style={[s.container, s.loading]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Profile</Text>
        </View>
        <View style={s.loginPrompt}>
          <Ionicons name="person-circle-outline" size={64} color={colors.border} />
          <Text style={s.loginText}>Sign in to see your profile and posts</Text>
          <Pressable style={s.loginBtn} onPress={() => router.push("/login" as any)}>
            <Text style={s.loginBtnText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const headerComponent = (
    <>
      <View style={s.profileCard}>
        <Avatar uri={profile?.avatar_url} name={profile?.full_name || profile?.username || "U"} size={72} />
        <Text style={s.name}>{profile?.full_name || "Anonymous"}</Text>
        <Text style={s.username}>@{profile?.username}</Text>
        {profile?.profession ? <Text style={s.profession}>{profile.profession}</Text> : null}
        {profile?.bio ? <Text style={s.bio}>{profile.bio}</Text> : null}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
        <Text style={s.sectionHeader}>My Posts</Text>
      </View>
    </>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Profile</Text>
        <Pressable style={s.settingsBtn} onPress={() => router.push("/settings" as any)}>
          <Feather name="settings" size={22} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} currentUserId={user.id} />}
        contentContainerStyle={[s.list, { paddingBottom: 100 }]}
        ListHeaderComponent={headerComponent}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="document-outline" size={36} color={colors.border} />
            <Text style={s.emptyText}>No posts yet</Text>
          </View>
        }
      />
    </View>
  );
}
