import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = "";
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if already subscribed
  useEffect(() => {
    if (!user || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then(async (registration) => {
      const sub = await registration.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    });
  }, [user]);

  const subscribe = useCallback(async () => {
    if (!user || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

    setLoading(true);
    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setLoading(false);
        return;
      }

      // Get VAPID public key from edge function
      const { data: session } = await supabase.auth.getSession();
      const { data: vapidData, error: vapidError } = await supabase.functions.invoke("setup-push", {
        headers: { Authorization: `Bearer ${session.session?.access_token}` },
      });

      if (vapidError || !vapidData?.publicKey) {
        throw new Error("Failed to get push configuration");
      }

      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey).buffer as ArrayBuffer,
      });

      const key = subscription.getKey("p256dh");
      const auth = subscription.getKey("auth");

      if (!key || !auth) throw new Error("Failed to get subscription keys");

      // Store subscription in database
      const { error: dbError } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: uint8ArrayToBase64Url(new Uint8Array(key)),
          auth: uint8ArrayToBase64Url(new Uint8Array(auth)),
        },
        { onConflict: "user_id,endpoint" }
      );

      if (dbError) throw dbError;

      setIsSubscribed(true);
    } catch (err) {
      console.error("Push subscription failed:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", subscription.endpoint);
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    }
  }, [user]);

  return {
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    isSupported: typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window,
  };
}
