import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { registerPushToken } from "@/lib/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function navigateToUrl(url: string) {
  try {
    router.push(url as any);
  } catch {
    console.warn("Deep link navigation failed:", url);
  }
}

export function useNotifications() {
  const { user, session } = useAuth();
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!user || !session) return;

    const token = session.access_token;

    registerForPushNotificationsAsync(user.id, token);

    Notifications.getLastNotificationResponseAsync().then((lastResponse) => {
      const url = (lastResponse?.notification.request.content.data as { url?: string })?.url;
      if (url) navigateToUrl(url);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as {
          url?: string;
        };
        if (data?.url) navigateToUrl(data.url);
      }
    );

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user?.id, session?.access_token]);
}

async function registerForPushNotificationsAsync(
  userId: string,
  authToken: string
): Promise<void> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    const platform = Platform.OS as "ios" | "android";
    await registerPushToken({ userId, token: tokenData.data, platform, authToken });
  } catch (err) {
    console.warn("Push notification setup failed:", err);
  }
}
