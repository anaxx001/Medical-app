import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { createClient } from "@/lib/supabase";

const PROFESSIONS = [
  "Medical Doctor", "Nurse", "Pharmacist", "Dentist",
  "Radiographer", "Physiotherapist", "Anatomist", "Other",
];

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [profession, setProfession] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup() {
    if (!email.trim() || !password || !username.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { data, error: signupErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { username: username.trim(), full_name: fullName.trim(), profession },
        },
      });
      if (signupErr) { setError(signupErr.message); return; }
      if (data.user) {
        await (supabase as any).from("profiles").upsert({
          id: data.user.id,
          username: username.trim(),
          full_name: fullName.trim(),
          profession,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/" as any);
      }
    } catch (e: any) {
      setError(e.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1 },
    inner: { padding: 24, paddingTop: topPadding + 20, paddingBottom: 40 },
    backBtn: { marginBottom: 24 },
    logo: { fontSize: 26, fontFamily: "Outfit_700Bold", color: colors.primary, marginBottom: 4 },
    logoAccent: { color: colors.accent },
    tagline: { fontSize: 14, color: colors.mutedForeground, fontFamily: "DMSans_400Regular", marginBottom: 28 },
    label: { fontSize: 12, fontFamily: "DMSans_500Medium", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      marginBottom: 14,
    },
    input: { flex: 1, paddingVertical: 13, fontSize: 15, color: colors.foreground, fontFamily: "DMSans_400Regular" },
    eyeBtn: { padding: 4 },
    sectionTitle: { fontSize: 12, fontFamily: "DMSans_500Medium", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },
    profList: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
    profChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 50,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    profChipActive: { borderColor: colors.primary, backgroundColor: colors.secondary },
    profChipText: { fontSize: 13, color: colors.foreground, fontFamily: "DMSans_400Regular" },
    profChipTextActive: { color: colors.primary, fontFamily: "DMSans_500Medium" },
    error: { color: colors.destructive, fontSize: 13, fontFamily: "DMSans_400Regular", marginBottom: 12, textAlign: "center" },
    submitBtn: { backgroundColor: colors.primary, borderRadius: 50, paddingVertical: 15, alignItems: "center", marginTop: 4 },
    submitDisabled: { opacity: 0.5 },
    submitText: { color: "#fff", fontSize: 16, fontFamily: "Outfit_700Bold" },
    footer: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 24 },
    footerText: { fontSize: 14, color: colors.mutedForeground, fontFamily: "DMSans_400Regular" },
    footerLink: { fontSize: 14, color: colors.primary, fontFamily: "DMSans_500Medium" },
  });

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.inner}>
          <Pressable style={s.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/" as any)}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={s.logo}>
            Med<Text style={s.logoAccent}>Student</Text>
          </Text>
          <Text style={s.tagline}>Create your free account</Text>

          <Text style={s.label}>Full Name</Text>
          <View style={s.inputWrap}>
            <TextInput style={s.input} placeholder="Dr. Chukwuemeka Obi" placeholderTextColor={colors.mutedForeground}
              value={fullName} onChangeText={setFullName} />
          </View>

          <Text style={s.label}>Username *</Text>
          <View style={s.inputWrap}>
            <TextInput style={s.input} placeholder="username" placeholderTextColor={colors.mutedForeground}
              value={username} onChangeText={setUsername} autoCapitalize="none" />
          </View>

          <Text style={s.label}>Email *</Text>
          <View style={s.inputWrap}>
            <TextInput style={s.input} placeholder="your@email.com" placeholderTextColor={colors.mutedForeground}
              value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          </View>

          <Text style={s.label}>Password *</Text>
          <View style={s.inputWrap}>
            <TextInput style={s.input} placeholder="Min. 6 characters" placeholderTextColor={colors.mutedForeground}
              value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
            <Pressable style={s.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <Text style={s.sectionTitle}>I am a...</Text>
          <View style={s.profList}>
            {PROFESSIONS.map((p) => (
              <Pressable key={p} style={[s.profChip, profession === p && s.profChipActive]} onPress={() => setProfession(p)}>
                <Text style={[s.profChipText, profession === p && s.profChipTextActive]}>{p}</Text>
              </Pressable>
            ))}
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <Pressable
            style={[s.submitBtn, (loading || !email || !password || !username) && s.submitDisabled]}
            onPress={handleSignup}
            disabled={loading || !email || !password || !username}
          >
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.submitText}>Create Account</Text>}
          </Pressable>

          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account?</Text>
            <Pressable onPress={() => router.push("/login" as any)}>
              <Text style={s.footerLink}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
