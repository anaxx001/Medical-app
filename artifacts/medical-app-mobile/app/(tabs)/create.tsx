import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";

interface Community { id: string; name: string; slug: string; icon: string; }

export default function CreateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // @ts-ignore
    supabase.from("communities").select("id, name, slug, icon").order("name")
      .then(({ data }) => { if (data) setCommunities(data as Community[]); });
  }, []);

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
    },
    title: { fontSize: 22, fontFamily: "Outfit_700Bold", color: colors.foreground },
    subtitle: { fontSize: 13, color: colors.mutedForeground, fontFamily: "DMSans_400Regular", marginTop: 2 },
    form: { padding: 16, gap: 14 },
    label: { fontSize: 12, fontFamily: "DMSans_500Medium", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
    input: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "DMSans_400Regular",
    },
    textarea: { minHeight: 100, textAlignVertical: "top" },
    communityList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    communityChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 50,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    communityChipActive: { borderColor: colors.primary, backgroundColor: colors.secondary },
    communityChipText: { fontSize: 13, color: colors.foreground, fontFamily: "DMSans_400Regular" },
    communityChipTextActive: { color: colors.primary, fontFamily: "DMSans_500Medium" },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: 50,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 8,
    },
    submitBtnDisabled: { opacity: 0.5 },
    submitText: { color: "#fff", fontSize: 15, fontFamily: "Outfit_700Bold" },
    error: { color: colors.destructive, fontSize: 13, fontFamily: "DMSans_400Regular", textAlign: "center" },
    successBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 24 },
    successText: { fontSize: 18, fontFamily: "Outfit_700Bold", color: colors.foreground },
    loginPrompt: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
    loginText: { fontSize: 16, color: colors.mutedForeground, fontFamily: "DMSans_400Regular", textAlign: "center" },
    loginBtn: { backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 50 },
    loginBtnText: { color: "#fff", fontSize: 15, fontFamily: "Outfit_700Bold" },
  });

  async function handleSubmit() {
    if (!title.trim() || !selectedCommunity) {
      setError("Please add a title and select a community.");
      return;
    }
    setError("");
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { error: err } = await (supabase as any).from("posts").insert({
        title: title.trim(),
        content: content.trim() || null,
        community_id: selectedCommunity.id,
        author_id: user!.id,
        upvotes: 0,
        downvotes: 0,
        is_announcement: false,
        is_pinned: false,
      });
      if (err) throw err;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setTitle(""); setContent(""); setSelectedCommunity(null); router.push("/"); }, 1500);
    } catch (e: any) {
      setError(e.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <View style={s.container}>
        <View style={s.header}><Text style={s.title}>Create Post</Text></View>
        <View style={s.loginPrompt}>
          <Ionicons name="create-outline" size={64} color={colors.border} />
          <Text style={s.loginText}>Sign in to share posts with your community</Text>
          <Pressable style={s.loginBtn} onPress={() => router.push("/login" as any)}>
            <Text style={s.loginBtnText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (success) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <View style={s.successBox}>
          <Ionicons name="checkmark-circle" size={72} color={colors.accent} />
          <Text style={s.successText}>Post Published!</Text>
          <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }}>Taking you to the feed...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Create Post</Text>
        <Text style={s.subtitle}>Share something with the community</Text>
      </View>
      <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={s.label}>Title *</Text>
          <TextInput
            style={s.input}
            placeholder="Post title..."
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
          />
        </View>
        <View>
          <Text style={s.label}>Content</Text>
          <TextInput
            style={[s.input, s.textarea]}
            placeholder="What's on your mind? (optional)"
            placeholderTextColor={colors.mutedForeground}
            value={content}
            onChangeText={setContent}
            multiline
          />
        </View>
        <View>
          <Text style={s.label}>Community *</Text>
          <View style={s.communityList}>
            {communities.map((c) => (
              <Pressable
                key={c.id}
                style={[s.communityChip, selectedCommunity?.id === c.id && s.communityChipActive]}
                onPress={() => setSelectedCommunity(c)}
              >
                <Text>{c.icon || "💬"}</Text>
                <Text style={[s.communityChipText, selectedCommunity?.id === c.id && s.communityChipTextActive]}>
                  {c.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Pressable
          style={[s.submitBtn, (submitting || !title.trim() || !selectedCommunity) && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting || !title.trim() || !selectedCommunity}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={s.submitText}>Publish Post</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
