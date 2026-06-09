import { Feather, Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { uploadPostFile, fileCategory, categoryIcon, type AttachedFile } from "@/lib/storage";
import { notifyAnnouncement } from "@/lib/api";

interface Community { id: string; name: string; slug: string; icon: string; }

export default function CreateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);

  useEffect(() => {
    // @ts-ignore
    supabase.from("communities").select("id, name, slug, icon").order("name")
      .then(({ data }: any) => { if (data) setCommunities(data as Community[]); });
  }, []);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo access to attach images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType || "image/jpeg";
    const ext = mimeType.split("/")[1] || "jpg";
    const fileName = asset.fileName || `photo.${ext}`;
    await doUpload(asset.uri, mimeType, fileName);
  }

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType || "application/octet-stream";
    await doUpload(asset.uri, mimeType, asset.name);
  }

  async function doUpload(uri: string, mimeType: string, fileName: string) {
    if (!user) return;
    setUploading(true);
    setError("");
    try {
      const file = await uploadPostFile(uri, mimeType, fileName, user.id);
      setAttachedFile(file);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      const msg = e?.message || "Upload failed";
      if (msg.includes("Bucket not found") || msg.includes("bucket")) {
        setError("Storage not set up yet — see instructions below.");
      } else {
        setError(msg);
      }
    } finally {
      setUploading(false);
    }
  }

  function removeFile() {
    setAttachedFile(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleSubmit() {
    if (!title.trim() || !selectedCommunity) {
      setError("Please add a title and select a community.");
      return;
    }
    setError("");
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { data: newPost, error: err } = await (supabase as any).from("posts").insert({
        title: title.trim(),
        content: content.trim() || null,
        community_id: selectedCommunity.id,
        author_id: user!.id,
        upvotes: 0,
        downvotes: 0,
        is_announcement: isAnnouncement,
        is_pinned: false,
        file_url: attachedFile?.url || null,
        file_type: attachedFile?.type || null,
      }).select("id").single();
      if (err) throw err;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (isAnnouncement && newPost?.id && session?.access_token) {
        notifyAnnouncement({
          communitySlug: selectedCommunity.slug,
          communityName: selectedCommunity.name,
          communityId: selectedCommunity.id,
          postId: newPost.id,
          postTitle: title.trim(),
          posterUserId: user!.id,
          authToken: session.access_token,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setTitle(""); setContent(""); setSelectedCommunity(null);
        setIsAnnouncement(false); setAttachedFile(null);
        router.push("/");
      }, 1500);
    } catch (e: any) {
      setError(e.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPadding + 8, paddingHorizontal: 16, paddingBottom: 14,
      backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    title: { fontSize: 22, fontFamily: "Outfit_700Bold", color: colors.foreground },
    subtitle: { fontSize: 13, color: colors.mutedForeground, fontFamily: "DMSans_400Regular", marginTop: 2 },
    form: { padding: 16, gap: 14 },
    label: { fontSize: 12, fontFamily: "DMSans_500Medium", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
    input: {
      backgroundColor: colors.card, borderRadius: colors.radius, borderWidth: 1,
      borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15, color: colors.foreground, fontFamily: "DMSans_400Regular",
    },
    textarea: { minHeight: 100, textAlignVertical: "top" },
    communityList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    communityChip: {
      flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12,
      paddingVertical: 8, borderRadius: 50, borderWidth: 1,
      borderColor: colors.border, backgroundColor: colors.card,
    },
    communityChipActive: { borderColor: colors.primary, backgroundColor: colors.secondary },
    communityChipText: { fontSize: 13, color: colors.foreground, fontFamily: "DMSans_400Regular" },
    communityChipTextActive: { color: colors.primary, fontFamily: "DMSans_500Medium" },
    attachRow: { flexDirection: "row", gap: 10 },
    attachBtn: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 8, backgroundColor: colors.card, borderRadius: colors.radius, borderWidth: 1,
      borderColor: colors.border, paddingVertical: 12,
    },
    attachBtnText: { fontSize: 13, fontFamily: "DMSans_500Medium", color: colors.foreground },
    attachPreview: {
      backgroundColor: colors.secondary, borderRadius: colors.radius, borderWidth: 1,
      borderColor: colors.primary, overflow: "hidden",
    },
    attachPreviewImage: { width: "100%", height: 140 },
    attachPreviewRow: {
      flexDirection: "row", alignItems: "center", gap: 10,
      padding: 12,
    },
    attachPreviewName: {
      flex: 1, fontSize: 13, fontFamily: "DMSans_400Regular", color: colors.foreground,
    },
    announcementRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      backgroundColor: colors.card, borderRadius: colors.radius, borderWidth: 1,
      borderColor: isAnnouncement ? colors.primary : colors.border,
      paddingHorizontal: 14, paddingVertical: 12,
    },
    announcementLabel: { fontSize: 14, fontFamily: "DMSans_500Medium", color: isAnnouncement ? colors.primary : colors.foreground },
    announcementDesc: { fontSize: 12, fontFamily: "DMSans_400Regular", color: colors.mutedForeground, marginTop: 2 },
    submitBtn: { backgroundColor: colors.primary, borderRadius: 50, paddingVertical: 14, alignItems: "center", marginTop: 8 },
    submitBtnDisabled: { opacity: 0.5 },
    submitText: { color: "#fff", fontSize: 15, fontFamily: "Outfit_700Bold" },
    error: { color: colors.destructive, fontSize: 13, fontFamily: "DMSans_400Regular" },
    successBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 24 },
    successText: { fontSize: 18, fontFamily: "Outfit_700Bold", color: colors.foreground },
    loginPrompt: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
    loginText: { fontSize: 16, color: colors.mutedForeground, fontFamily: "DMSans_400Regular", textAlign: "center" },
    loginBtn: { backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 50 },
    loginBtnText: { color: "#fff", fontSize: 15, fontFamily: "Outfit_700Bold" },
    storageNote: {
      backgroundColor: "#FFF8EC", borderRadius: 10, borderWidth: 1,
      borderColor: "#F5A623", padding: 12, gap: 4,
    },
    storageNoteTitle: { fontSize: 13, fontFamily: "DMSans_500Medium", color: "#92600A" },
    storageNoteBody: { fontSize: 12, fontFamily: "DMSans_400Regular", color: "#92600A", lineHeight: 18 },
  });

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
          <Text style={s.successText}>{isAnnouncement ? "Announcement Published!" : "Post Published!"}</Text>
          <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }}>Taking you to the feed...</Text>
        </View>
      </View>
    );
  }

  const cat = fileCategory(attachedFile?.type);
  const fileIcon = categoryIcon(cat);

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
          <Text style={s.label}>Attach Resource</Text>
          {attachedFile ? (
            <View style={s.attachPreview}>
              {cat === "image" ? (
                <Image source={{ uri: attachedFile.url }} style={s.attachPreviewImage} resizeMode="cover" />
              ) : null}
              <View style={s.attachPreviewRow}>
                <Text style={{ fontSize: 20 }}>{fileIcon}</Text>
                <Text style={s.attachPreviewName} numberOfLines={1}>{attachedFile.name}</Text>
                <Pressable onPress={removeFile}>
                  <Feather name="x-circle" size={20} color={colors.destructive} />
                </Pressable>
              </View>
            </View>
          ) : uploading ? (
            <View style={[s.attachBtn, { flex: 0 }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={s.attachBtnText}>Uploading...</Text>
            </View>
          ) : (
            <View style={s.attachRow}>
              <Pressable style={s.attachBtn} onPress={pickImage}>
                <Feather name="image" size={16} color={colors.primary} />
                <Text style={s.attachBtnText}>Photo</Text>
              </Pressable>
              <Pressable style={s.attachBtn} onPress={pickDocument}>
                <Feather name="file-text" size={16} color={colors.primary} />
                <Text style={s.attachBtnText}>PDF / Doc</Text>
              </Pressable>
            </View>
          )}
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

        <View>
          <Text style={s.label}>Post Type</Text>
          <Pressable style={s.announcementRow} onPress={() => setIsAnnouncement((v) => !v)}>
            <View style={{ flex: 1 }}>
              <Text style={s.announcementLabel}>📢 Post as Announcement</Text>
              <Text style={s.announcementDesc}>Notifies community members with a push notification</Text>
            </View>
            <Switch
              value={isAnnouncement}
              onValueChange={setIsAnnouncement}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </Pressable>
        </View>

        <View style={s.storageNote}>
          <Text style={s.storageNoteTitle}>⚙️ One-time setup needed for file uploads</Text>
          <Text style={s.storageNoteBody}>
            In your Supabase dashboard → Storage → New bucket → name it <Text style={{ fontFamily: "DMSans_500Medium" }}>post-files</Text> → set to Public. Then file uploads will work.
          </Text>
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}
        <Pressable
          style={[s.submitBtn, (submitting || uploading || !title.trim() || !selectedCommunity) && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting || uploading || !title.trim() || !selectedCommunity}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={s.submitText}>{isAnnouncement ? "Publish Announcement" : "Publish Post"}</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
