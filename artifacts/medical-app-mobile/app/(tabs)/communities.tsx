import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { createClient } from "@/lib/supabase";

interface Community {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  member_count?: number;
}

export default function CommunitiesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const supabase = createClient();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        // @ts-ignore
        const { data, error } = await supabase
          .from("communities")
          .select("id, name, slug, icon, description")
          .order("name");
        if (!error) setCommunities((data as Community[]) || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
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
    list: { paddingHorizontal: 14, paddingTop: 12 },
    item: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    iconText: { fontSize: 22 },
    info: { flex: 1 },
    name: { fontSize: 15, fontFamily: "Outfit_700Bold", color: colors.foreground, marginBottom: 2 },
    desc: { fontSize: 12, color: colors.mutedForeground, fontFamily: "DMSans_400Regular" },
    loading: { flex: 1, alignItems: "center", justifyContent: "center" },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
    emptyText: { fontSize: 15, color: colors.mutedForeground, fontFamily: "DMSans_400Regular", marginTop: 12 },
  });

  if (loading) {
    return (
      <View style={[s.container, s.loading]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Communities</Text>
        <Text style={s.subtitle}>Find your study group</Text>
      </View>
      <FlatList
        data={communities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[s.list, { paddingBottom: 100 }]}
        renderItem={({ item }) => (
          <Pressable style={s.item} onPress={() => router.push(`/c/${item.slug}` as any)}>
            <View style={s.iconBox}>
              <Text style={s.iconText}>{item.icon || "💬"}</Text>
            </View>
            <View style={s.info}>
              <Text style={s.name}>{item.name}</Text>
              {item.description ? (
                <Text style={s.desc} numberOfLines={1}>{item.description}</Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="people-outline" size={48} color={colors.border} />
            <Text style={s.emptyText}>No communities found</Text>
          </View>
        }
      />
    </View>
  );
}
