import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { themes } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Use AI to generate Unsplash search queries based on stitch/drop themes
    const themeList = (themes || []).slice(0, 10).join(", ");
    const prompt = themeList
      ? `Given these one-word themes from a social media app: ${themeList}

Generate exactly 6 nature/lifestyle Unsplash search queries that would match similar vibes and scenes of interest. Each query should be 2-4 words, evocative, and visually interesting.

Return ONLY a JSON array of strings, nothing else. Example: ["golden hour beach","misty mountain trail","cozy cafe rain","autumn forest path","ocean sunset cliffs","lavender field sunrise"]`
      : `Generate exactly 6 diverse nature/lifestyle Unsplash search queries for a social media discovery feed. Each should be 2-4 words, evocative, visually stunning.

Return ONLY a JSON array of strings, nothing else.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a creative assistant that generates search queries for beautiful imagery. Only respond with a JSON array." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    const queries = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    // Build Unsplash URLs (using their free source API)
    const discoveryItems = queries.slice(0, 6).map((query: string, i: number) => ({
      id: `ai-d-${i}`,
      query,
      image_url: `https://source.unsplash.com/800x1200/?${encodeURIComponent(query)}&sig=${Date.now()}-${i}`,
      display_name: query,
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
