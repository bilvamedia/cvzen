import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Generates a text embedding using the Lovable AI Gateway.
 * Input: { sectionIds: string[], column: "content" | "improved_content" }
 * Generates embeddings for the specified column of each section and stores them.
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

    // Convert section content to text for embedding
    const textsToEmbed: { id: string; text: string }[] = [];
    for (const section of sections) {
      const data = column === "content" ? section.content : section.improved_content;
      if (!data) continue;

      const items = data.items || [];
      const textParts = [`${section.section_title}:`];

      for (const item of items) {
        if (item.title) textParts.push(item.title);
        if (item.subtitle) textParts.push(item.subtitle);
        if (item.description) textParts.push(item.description);
        if (item.details && Array.isArray(item.details)) {
          textParts.push(...item.details);
        }
        if (item.tags && Array.isArray(item.tags)) {
          textParts.push(item.tags.join(", "));
        }
        if (item.date_range) textParts.push(item.date_range);
        if (item.location) textParts.push(item.location);
        if (item.level) textParts.push(`Level: ${item.level}`);
      }

      const fullText = textParts.join(" ").trim();
      if (fullText.length > 0) {
        textsToEmbed.push({ id: section.id, text: fullText });
      }
    }

    if (textsToEmbed.length === 0) {
      return new Response(JSON.stringify({ success: true, embedded: 0, message: "No content to embed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate embeddings via Lovable AI Gateway (batch)
    const embeddingResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: textsToEmbed.map(t => t.text),
        dimensions: 768,
      }),
    });

    if (!embeddingResponse.ok) {
      const errText = await embeddingResponse.text();
      console.error("Embedding API error:", embeddingResponse.status, errText);
      return new Response(JSON.stringify({ error: "Embedding generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const embeddingData = await embeddingResponse.json();
    const embeddings = embeddingData.data;

    if (!embeddings || embeddings.length !== textsToEmbed.length) {
      console.error("Embedding count mismatch:", embeddings?.length, textsToEmbed.length);
      return new Response(JSON.stringify({ error: "Embedding count mismatch" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update each section with its embedding
    const embeddingColumn = column === "content" ? "content_embedding" : "improved_content_embedding";
    let updated = 0;

    for (let i = 0; i < textsToEmbed.length; i++) {
      const vectorStr = `[${embeddings[i].embedding.join(",")}]`;
      const { error: updateError } = await supabase
        .from("resume_sections")
        .update({ [embeddingColumn]: vectorStr })
        .eq("id", textsToEmbed[i].id);

      if (updateError) {
        console.error("Update error for section", textsToEmbed[i].id, updateError);
      } else {
        updated++;
      }
    }

    console.log(`Embedded ${updated}/${textsToEmbed.length} sections (${column})`);

    return new Response(JSON.stringify({
      success: true,
      embedded: updated,
      total: textsToEmbed.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("generate-embeddings error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
