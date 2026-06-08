import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";

export default function AdminScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    (supabase as any)
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data }: { data: { role: string } | null }) => {
        setRole(data?.role ?? null);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (role !== "admin" && role !== "super_admin") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emoji}>🚫</Text>
          <Text style={styles.title}>Access Denied</Text>
          <Text style={styles.body}>You don't have permission to view this page.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
            <Text style={styles.btnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Admin Panel</Text>
        <Text style={styles.sub}>Manage your MedStudent community</Text>
        {[
          { label: "Manage Users", desc: "View and edit user roles", emoji: "👥" },
          { label: "Moderate Posts", desc: "Remove inappropriate content", emoji: "📄" },
          { label: "Manage Communities", desc: "Create or archive communities", emoji: "🏘" },
        ].map((item) => (
          <View key={item.label} style={styles.card}>
            <Text style={styles.cardEmoji}>{item.emoji}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>{item.label}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  container: { padding: 20 },
  heading: { fontFamily: "Outfit_700Bold", fontSize: 24, color: Colors.text, marginBottom: 4 },
  sub: { fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.textMuted, marginBottom: 20 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardEmoji: { fontSize: 28, marginRight: 14 },
  cardText: { flex: 1 },
  cardLabel: { fontFamily: "Outfit_600SemiBold", fontSize: 15, color: Colors.text },
  cardDesc: { fontFamily: "DMSans_400Regular", fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  emoji: { fontSize: 52, marginBottom: 16 },
  title: { fontFamily: "Outfit_700Bold", fontSize: 22, color: Colors.text, marginBottom: 8, textAlign: "center" },
  body: { fontFamily: "DMSans_400Regular", fontSize: 15, color: Colors.textMuted, textAlign: "center", marginBottom: 24 },
  btn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { fontFamily: "Outfit_600SemiBold", fontSize: 15, color: "#fff" },
});
