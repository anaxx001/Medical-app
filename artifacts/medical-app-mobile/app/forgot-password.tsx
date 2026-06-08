import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import Colors from "@/constants/colors";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleReset() {
    if (!email.trim()) { setError("Please enter your email."); return; }
    setLoading(true);
    setError("");
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (resetError) throw resetError;
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.logo}>
          <Text style={styles.logoEmoji}>🩺</Text>
          <Text style={styles.logoText}>MedStudent</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {sent ? "Check your inbox for a reset link." : "Enter your email and we'll send you a reset link."}
          </Text>

          {!sent && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleReset} disabled={loading}>
                <Text style={styles.btnText}>{loading ? "Sending…" : "Send Reset Link"}</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.link}>Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flexGrow: 1, justifyContent: "center", padding: 24 },
  logo: { alignItems: "center", marginBottom: 28 },
  logoEmoji: { fontSize: 36 },
  logoText: { fontFamily: "Outfit_800ExtraBold", fontSize: 26, color: Colors.primary, marginTop: 6 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 24, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  title: { fontFamily: "Outfit_700Bold", fontSize: 20, color: Colors.text, marginBottom: 6 },
  subtitle: { fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.textMuted, marginBottom: 20 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 13, fontFamily: "DMSans_400Regular", fontSize: 15, color: Colors.text, marginBottom: 12 },
  error: { color: "#E8445A", fontFamily: "DMSans_400Regular", fontSize: 13, marginBottom: 10 },
  btn: { backgroundColor: Colors.primary, borderRadius: 10, padding: 14, alignItems: "center", marginBottom: 16 },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontFamily: "Outfit_600SemiBold", fontSize: 15, color: "#fff" },
  link: { textAlign: "center", fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.primary },
});
