import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
};

// Known social crawler user agents
const CRAWLER_PATTERNS = [
  "facebookexternalhit",
  "Twitterbot",
  "LinkedInBot",
  "Slackbot",
  "WhatsApp",
  "Discordbot",
  "TelegramBot",
  "Googlebot",
  "bingbot",
  "iMessageBot",
  "Applebot",
];

function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some((p) => ua.includes(p.toLowerCase()));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const signalId = url.searchParams.get("id");

  if (!signalId) {
    return new Response("Missing signal id", { status: 400 });
  }

  const appUrl = Deno.env.get("APP_URL") || url.origin.replace("supabase.co/functions/v1/signal-og", "lovable.app");
  const signalPageUrl = `${appUrl}/signal/${signalId}`;
  const userAgent = req.headers.get("user-agent") || "";

  // If not a crawler, redirect straight to the app
  if (!isCrawler(userAgent)) {
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: signalPageUrl },
    });
  }

  // Fetch signal data for OG tags
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: signal } = await supabase
    .from("signals")
    .select("id, type, storage_path, stitch_word, heat_level, user_id, expires_at")
    .eq("id", signalId)
    .maybeSingle();

  // Default fallback
  let title = "arura — Life, Briefly Witnessed";
  let description = "A moment on arura. Open to see it before it burns out.";
  let imageUrl = `${appUrl}/icon-512.png`;

  if (signal) {
    // Check if expired
    const isExpired = new Date(signal.expires_at) < new Date();

    if (isExpired) {
      title = "This signal has burned out — arura";
      description = "This moment has faded. Join arura to catch the next one.";
    } else {
      // Get author name
      const { data: profile } = await supabase.rpc("get_public_profile", {
        p_user_id: signal.user_id,
      });
      const authorName = profile?.[0]?.display_name || "someone";

      title = signal.stitch_word
        ? `"${signal.stitch_word}" — ${authorName} on arura`
        : `${authorName} dropped a signal on arura`;

      const heatLabel = signal.heat_level !== "match" ? ` 🔥 ${signal.heat_level}` : "";
      description = `A ${signal.type === "photo" ? "photo" : "video"} signal${heatLabel}. Catch it before it burns out.`;

      // Use the actual media as OG image if it's a photo
      if (signal.storage_path && signal.type === "photo") {
        const { data: urlData } = supabase.storage
          .from("signals")
          .getPublicUrl(signal.storage_path);
        if (urlData?.publicUrl) {
          imageUrl = urlData.publicUrl;
        }
      }
    }
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:url" content="${escapeHtml(signalPageUrl)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="arura" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />

  <meta http-equiv="refresh" content="0; url=${escapeHtml(signalPageUrl)}" />
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(signalPageUrl)}">arura</a>...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
