import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Generates vector embeddings for resume sections.
 * Uses Gemini to produce a rich keyword expansion, then creates a
 * deterministic embedding via a hash-based approach for vector similarity.
 * 
 * Input: { sectionIds: string[], column: "content" | "improved_content" }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!supabaseUrl || !supabaseKey || !anonKey || !LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sectionIds, column } = await req.json();

    if (!sectionIds || !Array.isArray(sectionIds) || sectionIds.length === 0) {
      return new Response(JSON.stringify({ error: "sectionIds array is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!column || !["content", "improved_content"].includes(column)) {
      return new Response(JSON.stringify({ error: "column must be 'content' or 'improved_content'" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch sections
    const { data: sections, error: fetchError } = await supabase
      .from("resume_sections")
      .select("id, section_title, section_type, content, improved_content")
      .in("id", sectionIds)
      .eq("user_id", user.id);

    if (fetchError || !sections || sections.length === 0) {
      return new Response(JSON.stringify({ error: "Sections not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const embeddingColumn = column === "content" ? "content_embedding" : "improved_content_embedding";
    let updated = 0;

    for (const section of sections) {
      const data = column === "content" ? section.content : section.improved_content;
      if (!data) continue;

      const text = sectionToText(section.section_title, data);
      if (!text) continue;

      try {
        // Generate semantic keywords via AI for richer embedding
        const enrichedText = await enrichTextWithAI(text, section.section_type, LOVABLE_API_KEY);
        
        // Generate deterministic embedding from enriched text
        const embedding = generateDeterministicEmbedding(enrichedText, 768);
        const vectorStr = `[${embedding.join(",")}]`;

        const { error: updateError } = await supabase
          .from("resume_sections")
          .update({ [embeddingColumn]: vectorStr })
          .eq("id", section.id);

        if (updateError) {
          console.error("Update error for section", section.id, updateError);
        } else {
          updated++;
        }
      } catch (err) {
        console.error("Embedding error for section", section.id, err);
      }
    }

    console.log(`Embedded ${updated}/${sections.length} sections (${column})`);

    return new Response(JSON.stringify({
      success: true,
      embedded: updated,
      total: sections.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("generate-embeddings error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/** Convert section JSONB content to searchable text */
function sectionToText(title: string, data: any): string {
  const items = data?.items || [];
  const parts = [title];
  for (const item of items) {
    if (item.title) parts.push(item.title);
    if (item.subtitle) parts.push(item.subtitle);
    if (item.description) parts.push(item.description);
    if (Array.isArray(item.details)) parts.push(...item.details);
    if (Array.isArray(item.tags)) parts.push(item.tags.join(" "));
    if (item.date_range) parts.push(item.date_range);
    if (item.location) parts.push(item.location);
    if (item.level) parts.push(item.level);
  }
  return parts.join(" ").trim();
}

/** Use AI to expand text with semantic keywords for better matching */
async function enrichTextWithAI(text: string, sectionType: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a resume keyword expander. Given a resume section, output the original text PLUS related industry keywords, synonyms, and skill categories. Keep output under 500 words. Output plain text only, no formatting.`
          },
          {
            role: "user",
            content: `Section type: ${sectionType}\n\n${text.substring(0, 3000)}`
          }
        ],
        temperature: 0,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      console.warn("AI enrichment failed, using raw text:", response.status);
      return text;
    }

    const data = await response.json();
    const enriched = data.choices?.[0]?.message?.content?.trim();
    return enriched || text;
  } catch (err) {
    console.warn("AI enrichment error, using raw text:", err);
    return text;
  }
}

/**
 * Generate a deterministic 768-dim embedding from text using a hash-based approach.
 * This creates consistent vectors where similar texts produce similar vectors
 * through character n-gram hashing with TF-IDF-like weighting.
 */
function generateDeterministicEmbedding(text: string, dimensions: number): number[] {
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const words = normalized.split(" ");
  const embedding = new Float64Array(dimensions);

  // Word-level features with position encoding
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const posWeight = 1.0 / (1.0 + Math.log(1 + i)); // Position decay

    // Unigram hash
    const h1 = hashString(word);
    embedding[Math.abs(h1) % dimensions] += posWeight * (h1 > 0 ? 1 : -1);

    // Bigram hash (word pairs)
    if (i < words.length - 1) {
      const bigram = word + " " + words[i + 1];
      const h2 = hashString(bigram);
      embedding[Math.abs(h2) % dimensions] += posWeight * 0.7 * (h2 > 0 ? 1 : -1);
    }

    // Trigram hash (character-level for partial matching)
    for (let j = 0; j <= word.length - 3; j++) {
      const tri = word.substring(j, j + 3);
      const h3 = hashString(tri);
      embedding[Math.abs(h3) % dimensions] += posWeight * 0.3 * (h3 > 0 ? 1 : -1);
    }
  }

  // L2 normalize
  let norm = 0;
  for (let i = 0; i < dimensions; i++) norm += embedding[i] * embedding[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) embedding[i] /= norm;
  }

  return Array.from(embedding);
}

/** Simple string hash function (FNV-1a variant) */
function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash | 0; // Convert to 32-bit int
}
