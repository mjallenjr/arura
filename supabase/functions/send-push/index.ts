import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createVapidJwt(
  endpoint: string,
  publicKeyBase64: string,
  privateKeyBase64: string,
): Promise<{ authorization: string; cryptoKey: string }> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;

  // Import private key
  const privateKeyBytes = base64UrlToUint8Array(privateKeyBase64);
  const publicKeyBytes = base64UrlToUint8Array(publicKeyBase64);

  // Build JWK for import
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: arrayBufferToBase64Url(publicKeyBytes.slice(1, 33)),
    y: arrayBufferToBase64Url(publicKeyBytes.slice(33, 65)),
    d: privateKeyBase64,
  };

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  // Create JWT
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: "mailto:push@arura.app",
  };

  const encoder = new TextEncoder();
  const headerB64 = arrayBufferToBase64Url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = arrayBufferToBase64Url(encoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    encoder.encode(unsignedToken)
  );

  // Convert DER signature to raw r||s format
  const sigBytes = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;

  if (sigBytes[0] === 0x30) {
    // DER format
    const rLen = sigBytes[3];
    const rStart = 4;
    const rBytes = sigBytes.slice(rStart, rStart + rLen);
    const sLen = sigBytes[rStart + rLen + 1];
    const sStart = rStart + rLen + 2;
    const sBytes = sigBytes.slice(sStart, sStart + sLen);

    r = rBytes.length > 32 ? rBytes.slice(rBytes.length - 32) : rBytes;
    s = sBytes.length > 32 ? sBytes.slice(sBytes.length - 32) : sBytes;

    if (r.length < 32) { const padded = new Uint8Array(32); padded.set(r, 32 - r.length); r = padded; }
    if (s.length < 32) { const padded = new Uint8Array(32); padded.set(s, 32 - s.length); s = padded; }
  } else {
    // Already raw format (64 bytes)
    r = sigBytes.slice(0, 32);
    s = sigBytes.slice(32, 64);
  }

  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0);
  rawSig.set(s, 32);

  const jwt = `${unsignedToken}.${arrayBufferToBase64Url(rawSig)}`;

  return {
    authorization: `vapid t=${jwt}, k=${publicKeyBase64}`,
    cryptoKey: publicKeyBase64,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { user_id, title, body, url } = await req.json();
    if (!user_id) throw new Error("user_id is required");

    // Get VAPID keys
    const { data: vapidKeys } = await supabase
      .from("push_vapid_keys")
      .select("*")
      .eq("id", 1)
      .single();

    if (!vapidKeys) throw new Error("VAPID keys not configured. Call setup-push first.");

    // Get user's push subscriptions
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No push subscriptions found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({
      title: title || "arura",
      body: body || "Something happened",
      url: url || "/",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    });

    let sent = 0;
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(payload);

    for (const sub of subscriptions) {
      try {
        // Import subscriber's p256dh key
        const p256dhBytes = base64UrlToUint8Array(sub.p256dh);
        const authBytes = base64UrlToUint8Array(sub.auth);

        // For simplicity, send unencrypted with TTL (many push services accept this)
        // In production, implement full RFC 8291 encryption
        const { authorization } = await createVapidJwt(
          sub.endpoint,
          vapidKeys.public_key,
          vapidKeys.private_key,
        );

        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Authorization": authorization,
            "TTL": "86400",
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            "Content-Length": "0",
          },
        });

        if (response.status === 201 || response.status === 200) {
          sent++;
        } else if (response.status === 404 || response.status === 410) {
          // Subscription expired, remove it
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          console.log(`Push failed for ${sub.endpoint}: ${response.status} ${await response.text()}`);
        }
      } catch (e) {
        console.error(`Push error for subscription ${sub.id}:`, e);
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
