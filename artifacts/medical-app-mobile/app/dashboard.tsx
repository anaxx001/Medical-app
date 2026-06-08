import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

const CARDS = [
  { href: "/flashcards", emoji: "📖", label: "Flashcards", desc: "Review key concepts fast", color: Colors.primary },
  { href: "/quiz", emoji: "🧠", label: "Quiz", desc: "Test your knowledge", color: Colors.accent },
  { href: "/notes", emoji: "📝", label: "Notes", desc: "Structured study notes", color: "#F5A623" },
  { href: "/past-questions", emoji: "📋", label: "Past Questions", desc: "Practice exam questions", color: "#9B6DFF" },
  { href: "/(tabs)/chatbot", emoji: "💬", label: "AI Chatbot", desc: "Ask anything medical", color: "#E8445A" },
];

export default function DashboardScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Study Dashboard</Text>
        <Text style={styles.sub}>Your learning tools in one place</Text>
        <View style={styles.grid}>
          {CARDS.map((card) => (
            <TouchableOpacity key={card.href} style={styles.card} onPress={() => router.push(card.href as any)}>
              <Text style={styles.emoji}>{card.emoji}</Text>
              <Text style={[styles.label, { color: card.color }]}>{card.label}</Text>
              <Text style={styles.desc}>{card.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.statsRow}>
          {[{ emoji: "🔥", label: "Streak", val: "—" }, { emoji: "🏆", label: "Points", val: "—" }, { emoji: "⏱", label: "Study Time", val: "—" }].map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 20 },
  heading: { fontFamily: "Outfit_700Bold", fontSize: 24, color: Colors.text, marginBottom: 4 },
  sub: { fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.textMuted, marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: "47%", backgroundColor: Colors.surface, borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  emoji: { fontSize: 28, marginBottom: 8 },
  label: { fontFamily: "Outfit_600SemiBold", fontSize: 15, marginBottom: 4 },
  desc: { fontFamily: "DMSans_400Regular", fontSize: 12, color: Colors.textMuted },
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 24, backgroundColor: Colors.surface, borderRadius: 14, padding: 16 },
  stat: { alignItems: "center" },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statVal: { fontFamily: "Outfit_700Bold", fontSize: 18, color: Colors.text },
  statLabel: { fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});
