import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { sendChatMessage } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Explain the brachial plexus",
  "Mnemonics for cranial nerves",
  "How does X-ray imaging work?",
  "Explain glycolysis steps",
  "What is the cardiac cycle?",
];

export default function ChatbotScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  async function send(text?: string) {
    const content = (text || input).trim();
    if (!content || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput("");

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setLoading(true);

    try {
      const reply = await sendChatMessage(
        currentMessages.map((m) => ({ role: m.role, content: m.content }))
      );
      setMessages([
        ...currentMessages,
        { id: (Date.now() + 1).toString(), role: "assistant", content: reply },
      ]);
    } catch {
      setMessages([
        ...currentMessages,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "Sorry, I couldn't connect. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPadding + 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    headerIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    headerText: { flex: 1 },
    headerTitle: { fontSize: 16, fontFamily: "Outfit_700Bold", color: colors.foreground },
    headerSub: { fontSize: 11, color: colors.accent, fontFamily: "DMSans_400Regular" },
    clearBtn: { padding: 4 },
    list: { flex: 1 },
    listContent: { padding: 14, gap: 10 },
    bubble: {
      maxWidth: "82%",
      borderRadius: 16,
      padding: 12,
    },
    userBubble: {
      alignSelf: "flex-end",
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    aiBubble: {
      alignSelf: "flex-start",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomLeftRadius: 4,
    },
    userText: { color: "#fff", fontSize: 14, fontFamily: "DMSans_400Regular", lineHeight: 20 },
    aiText: { color: colors.foreground, fontSize: 14, fontFamily: "DMSans_400Regular", lineHeight: 20 },
    suggestions: {
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    suggestionsTitle: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "DMSans_500Medium",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    suggestionChip: {
      backgroundColor: colors.secondary,
      borderRadius: 50,
      paddingHorizontal: 12,
      paddingVertical: 7,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    suggestionText: { fontSize: 12, color: colors.foreground, fontFamily: "DMSans_400Regular" },
    inputArea: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 14,
      paddingVertical: 10,
      paddingBottom: insets.bottom + 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
      gap: 8,
    },
    inputWrap: {
      flex: 1,
      backgroundColor: colors.surface2,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      maxHeight: 100,
    },
    input: {
      fontSize: 14,
      color: colors.foreground,
      fontFamily: "DMSans_400Regular",
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: { backgroundColor: colors.muted },
    typing: {
      alignSelf: "flex-start",
      backgroundColor: colors.card,
      borderRadius: 16,
      borderBottomLeftRadius: 4,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[s.bubble, item.role === "user" ? s.userBubble : s.aiBubble]}>
      <Text style={item.role === "user" ? s.userText : s.aiText}>{item.content}</Text>
    </View>
  );

  const isEmpty = messages.length === 0;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.headerIcon}>
          <Ionicons name="medical" size={18} color="#fff" />
        </View>
        <View style={s.headerText}>
          <Text style={s.headerTitle}>MedAI Assistant</Text>
          <Text style={s.headerSub}>Powered by Gemini</Text>
        </View>
        {messages.length > 0 && (
          <Pressable style={s.clearBtn} onPress={() => setMessages([])}>
            <Feather name="trash-2" size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {isEmpty ? (
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
              <Ionicons name="medical-outline" size={56} color={colors.border} />
              <Text style={{ fontSize: 20, fontFamily: "Outfit_700Bold", color: colors.foreground, marginTop: 16, textAlign: "center" }}>
                Your Medical AI
              </Text>
              <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: "DMSans_400Regular", textAlign: "center", marginTop: 6, lineHeight: 20 }}>
                Ask anything about anatomy, physiology, pharmacology, or clinical medicine.
              </Text>
            </View>
            <View style={s.suggestions}>
              <Text style={s.suggestionsTitle}>Try asking</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {SUGGESTIONS.map((s2, i) => (
                  <Pressable key={i} style={s.suggestionChip} onPress={() => send(s2)}>
                    <Text style={s.suggestionText}>{s2}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={[...messages].reverse()}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[s.listContent, { paddingBottom: 10 }]}
            inverted
            ListHeaderComponent={
              loading ? (
                <View style={s.typing}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
          />
        )}

        <View style={s.inputArea}>
          <TextInput
            style={[s.inputWrap, s.input]}
            placeholder="Ask a medical question..."
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => send()}
          />
          <Pressable
            style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
            onPress={() => send()}
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={18} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
