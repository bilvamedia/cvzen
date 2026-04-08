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

    const { sectionId } = await req.json();
    if (!sectionId) {
      return new Response(JSON.stringify({ error: "sectionId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Fetch ATS score/suggestions for this section
    const { data: atsScore } = await supabase
      .from("ats_section_scores")
      .select("*")
      .eq("section_id", sectionId)
      .single();

    const suggestions = atsScore?.suggestions || [];
    const keywordsMissing = atsScore?.keywords_missing || [];
    const feedback = atsScore?.feedback || "";

    const systemPrompt = `You are an expert resume writer and ATS optimization specialist. You will receive a resume section with its original content, ATS feedback, suggestions for improvement, and missing keywords.

Your task is to IMPROVE the section content while:
1. Preserving all factual information (dates, company names, titles, degrees, etc.)
2. Incorporating the specific suggestions provided
3. Adding missing keywords naturally where they fit
4. Using stronger action verbs and quantified achievements
5. Improving ATS compatibility without making it sound robotic
6. Keeping the same JSON structure as the original content

IMPORTANT: Return the improved content in the EXACT same JSON structure as the input. Each item should have the same fields (title, subtitle, date_range, location, description, details, tags, etc.) but with improved text.

You must call the return_improved_content tool with the improved items.`;

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
          {
            role: "user",
            content: `Improve this "${section.section_title}" section.

ORIGINAL CONTENT:
${JSON.stringify(section.content, null, 2)}

ATS FEEDBACK: ${feedback}

SUGGESTIONS TO IMPLEMENT:
${suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}

MISSING KEYWORDS TO INCORPORATE:
${keywordsMissing.join(", ")}

Return the improved version preserving the same JSON structure.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_improved_content",
              description: "Return the improved section content",
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

    if (!parsed?.items) {
      console.error("AI did not return improved content");
      return new Response(JSON.stringify({ error: "AI did not return improved content" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save improved content (original stays in `content`)
    const { error: updateError } = await supabase
      .from("resume_sections")
      .update({ improved_content: { items: parsed.items } })
      .eq("id", sectionId);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to save improved content" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      improved_content: { items: parsed.items },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("improve-section error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
