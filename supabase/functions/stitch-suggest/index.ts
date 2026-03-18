import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Server-side rate limit: 20 calls per hour per user
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count } = await serviceClient
      .from("interest_searches")
      .select("*", { count: "exact", head: true })
      .eq("term", `ratelimit:stitch-suggest:${userId}`)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= 20) {
      return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log rate limit entry
    await serviceClient.from("interest_searches").insert({ term: `ratelimit:stitch-suggest:${userId}` });

    const { creator_name, stitch_word, media_type, display_name } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are the vibe curator for Arura — a raw, unfiltered social platform where people drop 5-second moments from their real life. Users "stitch" drops by replying with a single word (max 12 chars, no spaces).

Your job: suggest 5 stitch words that are hip, cool, socially relevant, engaging, and sexy. Think Gen-Z energy, poetic brevity, emotional resonance. Words should feel like they belong on a mood board — evocative, surprising, magnetic.

Rules:
- Each word must be 1-12 characters, no spaces
- Make them varied: mix emotions, reactions, vibes, slang, poetic fragments
- Consider the context: the creator's name, any existing word on the drop, and the media type
- Be culturally aware — reference current slang, aesthetics, emotions
- Never be basic or generic. No "nice", "cool", "wow", "great"
- Think: what would make someone stop scrolling and feel something?

Return ONLY a JSON array of exactly 5 strings. Example: ["ethereal","obsessed","golden","untamed","velvet"]`;

    const userPrompt = `Drop context:
- Creator: ${creator_name || "unknown"}
- Media type: ${media_type || "photo"}
- Word on drop: ${stitch_word || "none"}
- Scene: ${display_name || "unknown"}

Give me 5 fire stitch words.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_stitch_words",
              description: "Return exactly 5 stitch word suggestions",
              parameters: {
                type: "object",
                properties: {
                  words: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 5,
                    maxItems: 5,
                  },
                },
                required: ["words"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_stitch_words" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let words: string[] = [];

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        words = (parsed.words || [])
          .map((w: string) => w.replace(/\s/g, "").slice(0, 12).toLowerCase())
          .filter((w: string) => w.length > 0)
          .slice(0, 5);
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    // Fallback if parsing failed
    if (words.length === 0) {
      words = ["ethereal", "obsessed", "golden", "untamed", "velvet"];
    }

    return new Response(JSON.stringify({ words }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("stitch-suggest error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
