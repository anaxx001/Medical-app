import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

export default function FlashcardsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.emoji}>📖</Text>
        <Text style={styles.title}>Flashcards</Text>
        <Text style={styles.body}>Flashcard study mode is coming soon. Review key medical concepts with spaced repetition.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontFamily: "Outfit_700Bold", fontSize: 22, color: Colors.text, marginBottom: 10, textAlign: "center" },
  body: { fontFamily: "DMSans_400Regular", fontSize: 15, color: Colors.textMuted, textAlign: "center", lineHeight: 22 },
});
