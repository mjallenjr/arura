import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Curated list of working high-quality image URLs from Unsplash (photos endpoint)
const STOCK_IMAGES = [
  { query: "golden hour mountain", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1200&fit=crop" },
  { query: "misty forest trail", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=1200&fit=crop" },
  { query: "ocean sunset cliffs", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=1200&fit=crop" },
  { query: "lavender field sunrise", url: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=800&h=1200&fit=crop" },
  { query: "autumn forest path", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1200&fit=crop" },
  { query: "cozy rainy window", url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&h=1200&fit=crop" },
  { query: "northern lights sky", url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=1200&fit=crop" },
  { query: "tropical beach paradise", url: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&h=1200&fit=crop" },
  { query: "desert sand dunes", url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&h=1200&fit=crop" },
  { query: "cherry blossom spring", url: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&h=1200&fit=crop" },
  { query: "snowy cabin retreat", url: "https://images.unsplash.com/photo-1520769669658-f07657f5a307?w=800&h=1200&fit=crop" },
  { query: "waterfall jungle mist", url: "https://images.unsplash.com/photo-1432405972618-c6b0cfba8427?w=800&h=1200&fit=crop" },
  { query: "starry night camping", url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=1200&fit=crop" },
  { query: "wildflower meadow", url: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=800&h=1200&fit=crop" },
  { query: "sunrise yoga beach", url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=1200&fit=crop" },
  { query: "mountain lake reflection", url: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&h=1200&fit=crop" },
  { query: "foggy pier morning", url: "https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=800&h=1200&fit=crop" },
  { query: "colorful street market", url: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&h=1200&fit=crop" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Server-side rate limit: 30 calls per hour per user
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count } = await serviceClient
      .from("interest_searches")
      .select("*", { count: "exact", head: true })
      .eq("term", `ratelimit:discover:${userId}`)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= 30) {
      return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await serviceClient.from("interest_searches").insert({ term: `ratelimit:discover:${userId}` });

    const { themes } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    let selectedImages = shuffleArray(STOCK_IMAGES).slice(0, 6);

    // If we have themes and an API key, try to get AI-curated selections
    if (LOVABLE_API_KEY && themes && themes.length > 0) {
      try {
        const themeList = themes.slice(0, 10).join(", ");
        const prompt = `Given these one-word themes: ${themeList}

Pick the 6 most relevant items from this list and return their indices (0-based). List: ${STOCK_IMAGES.map((s, i) => `${i}:${s.query}`).join(", ")}

Return ONLY a JSON array of numbers, e.g. [0,3,5,7,11,15]`;

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: "You select image indices. Only respond with a JSON array of numbers." },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || "[]";
          const jsonMatch = content.match(/\[[\s\S]*?\]/);
          if (jsonMatch) {
            const indices: number[] = JSON.parse(jsonMatch[0]);
            const valid = indices.filter((i) => i >= 0 && i < STOCK_IMAGES.length);
            if (valid.length >= 4) {
              selectedImages = valid.slice(0, 6).map((i) => STOCK_IMAGES[i]);
            }
          }
        }
      } catch {
        // Fall back to random selection
      }
    }

    const discoveryItems = selectedImages.map((item, i) => ({
      id: `ai-d-${i}`,
      query: item.query,
      image_url: item.url,
      display_name: item.query,
    }));

    return new Response(JSON.stringify({ items: discoveryItems }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("discovery error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
