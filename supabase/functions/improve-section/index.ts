import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const body = await req.json();

    // Custom prompt mode (e.g. bio generation)
    if (body.customPrompt && body.prompt) {
      const aiRes = await fetch("https://api.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a professional resume and career coach." },
            { role: "user", content: body.prompt },
          ],
          temperature: 0.7,
        }),
      });
      const aiRawText = await aiRes.text();
      let aiData;
      try {
        aiData = JSON.parse(aiRawText);
      } catch {
        console.error("AI response not JSON:", aiRawText.substring(0, 500));
        return new Response(JSON.stringify({ error: "AI returned invalid response" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = aiData.choices?.[0]?.message?.content?.trim() || "";
      if (!text) {
        return new Response(JSON.stringify({ error: "AI did not return text" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ improved_text: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sectionId, itemIndex } = body;
    if (!sectionId) {
      return new Response(JSON.stringify({ error: "sectionId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // itemIndex can be a number (improve single item) or undefined (improve all)
    const isSingleItem = typeof itemIndex === "number";

    // Fetch the section
    const { data: section, error: sectionError } = await supabase
      .from("resume_sections")
      .select("*")
      .eq("id", sectionId)
      .eq("user_id", user.id)
      .single();

    if (sectionError || !section) {
      return new Response(JSON.stringify({ error: "Section not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const originalItems = section.content?.items || [];
    const currentImproved = section.improved_content?.items || [...originalItems];

    if (isSingleItem && (itemIndex < 0 || itemIndex >= originalItems.length)) {
      return new Response(JSON.stringify({ error: "Invalid itemIndex" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch ATS score/suggestions for this section
    const { data: atsScore } = await supabase
      .from("ats_section_scores")
      .select("*")
      .eq("section_id", sectionId)
      .single();

    const allSuggestions = Array.isArray(atsScore?.suggestions) ? atsScore.suggestions : [];
    const keywordsMissing = Array.isArray(atsScore?.keywords_missing) ? atsScore.keywords_missing : [];
    const feedback = atsScore?.feedback || "";

    // Build content to improve
    const itemsToImprove = isSingleItem ? [originalItems[itemIndex]] : originalItems;
    
    // Find relevant item-level suggestions
    let itemSuggestionText = "";
    if (isSingleItem) {
      const itemTitle = originalItems[itemIndex]?.title || "";
      // Find matching item feedback from ATS suggestions
      const matchingFeedback = allSuggestions.find((s: any) => 
        s.item_title && itemTitle && s.item_title.toLowerCase().includes(itemTitle.toLowerCase().substring(0, 20))
      );
      if (matchingFeedback) {
        const improvements = Array.isArray(matchingFeedback.improvements) ? matchingFeedback.improvements : [];
        const missingKw = Array.isArray(matchingFeedback.keywords_missing) ? matchingFeedback.keywords_missing : [];
        itemSuggestionText = `
SPECIFIC IMPROVEMENTS FOR THIS ITEM:
${improvements.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}

MISSING KEYWORDS FOR THIS ITEM:
${missingKw.join(", ")}`;
      }
    }

    const systemPrompt = `You are an expert resume writer and ATS optimization specialist. You will receive ${isSingleItem ? "a single resume item" : "resume section items"} to improve.

Your task is to IMPROVE the content while:
1. Preserving all factual information (dates, company names, titles, degrees, etc.)
2. Incorporating the specific suggestions provided
3. Adding missing keywords naturally where they fit
4. Using stronger action verbs and quantified achievements
5. Improving ATS compatibility without making it sound robotic
6. Keeping the same JSON structure as the original content

IMPORTANT: Return the improved content in the EXACT same JSON structure. Each item should have the same fields but with improved text.
You must call the return_improved_content tool with the improved items.`;

    const userMessage = isSingleItem
      ? `Improve this single item from the "${section.section_title}" section.

ORIGINAL ITEM:
${JSON.stringify(itemsToImprove[0], null, 2)}

ATS SECTION FEEDBACK: ${feedback}
${itemSuggestionText}

SECTION-LEVEL MISSING KEYWORDS: ${keywordsMissing.join(", ")}

Return the improved version of this single item.`
      : `Improve this "${section.section_title}" section.

ORIGINAL CONTENT:
${JSON.stringify(itemsToImprove, null, 2)}

ATS FEEDBACK: ${feedback}

SUGGESTIONS TO IMPLEMENT:
${allSuggestions.map((s: any) => {
  if (typeof s === "string") return s;
  const improvements = Array.isArray(s.improvements) ? s.improvements : [];
  return `${s.item_title || "General"}: ${improvements.join("; ")}`;
}).join("\n")}

MISSING KEYWORDS TO INCORPORATE:
${keywordsMissing.join(", ")}

Return the improved version preserving the same JSON structure.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_improved_content",
              description: "Return the improved content",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        subtitle: { type: "string" },
                        date_range: { type: "string" },
                        location: { type: "string" },
                        description: { type: "string" },
                        details: { type: "array", items: { type: "string" } },
                        tags: { type: "array", items: { type: "string" } },
                        url: { type: "string" },
                        level: { type: "string" },
                      },
                      additionalProperties: true,
                    },
                  },
                },
                required: ["items"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_improved_content" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI improvement failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let parsed: any;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      parsed = JSON.parse(toolCall.function.arguments);
    } else {
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*"items"[\s\S]*\}/);
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[0]); } catch { /* ignore */ }
      }
    }

    if (!parsed?.items || parsed.items.length === 0) {
      console.error("AI did not return improved content");
      return new Response(JSON.stringify({ error: "AI did not return improved content" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Merge: if single item, replace just that index in the improved array
    let finalItems: any[];
    if (isSingleItem) {
      finalItems = [...currentImproved];
      finalItems[itemIndex] = parsed.items[0];
    } else {
      finalItems = parsed.items;
    }

    // Save improved content
    const { error: updateError } = await supabase
      .from("resume_sections")
      .update({ improved_content: { items: finalItems } })
      .eq("id", sectionId);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to save improved content" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      improved_content: { items: finalItems },
      improved_index: isSingleItem ? itemIndex : null,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("improve-section error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
