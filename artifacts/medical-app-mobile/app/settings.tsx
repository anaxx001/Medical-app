import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/Avatar";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [profession, setProfession] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    // @ts-ignore
    supabase.from("profiles").select("full_name, bio, profession").eq("id", user.id).single()
      .then(({ data }: { data: any }) => {
        if (data) {
          setFullName(data.full_name || "");
          setBio(data.bio || "");
          setProfession(data.profession || "");
        }
      });
  }, [user?.id]);

  async function handleSave() {
    if (!user?.id) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // @ts-ignore
      await supabase.from("profiles").update({ full_name: fullName.trim(), bio: bio.trim(), profession: profession.trim() }).eq("id", user.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); } finally { setSaving(false); }
  }

  async function handleSignOut() {
    if (Platform.OS === "web") {
      await signOut();
      router.replace("/" as any);
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await signOut(); router.replace("/" as any); } },
    ]);
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
    navTitle: { flex: 1, fontSize: 17, fontFamily: "Outfit_700Bold", color: colors.foreground, textAlign: "center" },
    scroll: { padding: 16 },
    avatarSection: { alignItems: "center", paddingVertical: 24 },
    emailText: { fontSize: 14, color: colors.mutedForeground, fontFamily: "DMSans_400Regular", marginTop: 8 },
    label: { fontSize: 12, fontFamily: "DMSans_500Medium", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, marginTop: 14 },
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
    saveBtn: { backgroundColor: colors.primary, borderRadius: 50, paddingVertical: 14, alignItems: "center", marginTop: 20 },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Outfit_700Bold" },
    savedText: { color: colors.accent },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 24 },
    signOutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 50,
      borderWidth: 1,
      borderColor: colors.destructive,
    },
    signOutText: { color: colors.destructive, fontSize: 15, fontFamily: "DMSans_500Medium" },
    loginPrompt: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
    loginText: { fontSize: 16, color: colors.mutedForeground, fontFamily: "DMSans_400Regular", textAlign: "center" },
    loginBtn: { backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 50 },
    loginBtnText: { color: "#fff", fontSize: 15, fontFamily: "Outfit_700Bold" },
  });

  if (!user) {
    return (
      <View style={s.container}>
        <View style={s.navBar}>
          <Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.foreground} /></Pressable>
          <Text style={s.navTitle}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={s.loginPrompt}>
          <Ionicons name="settings-outline" size={64} color={colors.border} />
          <Text style={s.loginText}>Sign in to manage your settings</Text>
          <Pressable style={s.loginBtn} onPress={() => router.push("/login" as any)}>
            <Text style={s.loginBtnText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.navBar}>
        <Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.foreground} /></Pressable>
        <Text style={s.navTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: 40 }]} keyboardShouldPersistTaps="handled">
        <View style={s.avatarSection}>
          <Avatar uri={undefined} name={fullName || user.email || "U"} size={72} />
          <Text style={s.emailText}>{user.email}</Text>
        </View>

        <Text style={s.label}>Full Name</Text>
        <TextInput style={s.input} value={fullName} onChangeText={setFullName} placeholder="Full name" placeholderTextColor={colors.mutedForeground} />

        <Text style={s.label}>Profession</Text>
        <TextInput style={s.input} value={profession} onChangeText={setProfession} placeholder="e.g. Medical Doctor" placeholderTextColor={colors.mutedForeground} />

        <Text style={s.label}>Bio</Text>
        <TextInput
          style={[s.input, { minHeight: 80, textAlignVertical: "top" }]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about yourself..."
          placeholderTextColor={colors.mutedForeground}
          multiline
        />

        <Pressable style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[s.saveBtnText, saved && s.savedText]}>{saved ? "Saved!" : "Save Changes"}</Text>
          )}
        </Pressable>

        <View style={s.divider} />

        <Pressable style={s.signOutBtn} onPress={handleSignOut}>
          <Feather name="log-out" size={16} color={colors.destructive} />
          <Text style={s.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
