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

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!email.trim() || !password) { setError("Please fill in all fields."); return; }
    setError("");
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) { setError(err.message); return; }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/" as any);
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1, justifyContent: "center" },
    inner: { padding: 24, paddingTop: topPadding + 20 },
    backBtn: { marginBottom: 24 },
    logo: { fontSize: 28, fontFamily: "Outfit_700Bold", color: colors.primary, marginBottom: 4 },
    logoAccent: { color: colors.accent },
    tagline: { fontSize: 14, color: colors.mutedForeground, fontFamily: "DMSans_400Regular", marginBottom: 32 },
    label: { fontSize: 12, fontFamily: "DMSans_500Medium", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      marginBottom: 16,
    },
    input: { flex: 1, paddingVertical: 13, fontSize: 15, color: colors.foreground, fontFamily: "DMSans_400Regular" },
    eyeBtn: { padding: 4 },
    error: { color: colors.destructive, fontSize: 13, fontFamily: "DMSans_400Regular", marginBottom: 12, textAlign: "center" },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: 50,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 4,
    },
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
          <Text style={s.tagline}>Welcome back — sign in to continue</Text>

          <Text style={s.label}>Email</Text>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              placeholder="your@email.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <Text style={s.label}>Password</Text>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              placeholder="Password"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <Pressable style={s.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <Pressable
            style={[s.submitBtn, (loading || !email || !password) && s.submitDisabled]}
            onPress={handleLogin}
            disabled={loading || !email || !password}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.submitText}>Sign In</Text>
            )}
          </Pressable>

          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account?</Text>
            <Pressable onPress={() => router.push("/signup" as any)}>
              <Text style={s.footerLink}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
