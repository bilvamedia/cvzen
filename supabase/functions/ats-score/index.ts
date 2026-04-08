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

    const { resumeId } = await req.json();
    if (!resumeId) {
      return new Response(JSON.stringify({ error: "resumeId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all sections for this resume
    const { data: sections, error: sectionsError } = await supabase
      .from("resume_sections")
      .select("*")
      .eq("resume_id", resumeId)
      .eq("user_id", user.id)
      .order("display_order", { ascending: true });

    if (sectionsError || !sections || sections.length === 0) {
      return new Response(JSON.stringify({ error: "No resume sections found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build section summaries for AI — use improved content when available
    const sectionSummaries = sections.map(s => ({
      id: s.id,
      section_type: s.section_type,
      section_title: s.section_title,
      content: s.improved_content || s.content,
    }));

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) scoring engine. You will receive resume sections and must score EACH section individually on a 0-100 scale based on real ATS criteria.

Scoring criteria per section type (adapt dynamically):
- For experience sections: quantified achievements, action verbs, relevance, duration clarity, progression
- For skills sections: specificity, industry-relevant keywords, categorization, breadth vs depth
- For education sections: relevance, GPA if strong, certifications, coursework
- For summary sections: clarity, keyword density, value proposition, length
- For projects sections: tech stack mentions, impact metrics, links
- For certifications: relevance, recency, issuing authority
- For any other section: content quality, relevance, completeness

CRITICAL: Each section may contain MULTIPLE items (e.g. multiple jobs in Professional Experience, multiple degrees in Education). You MUST analyze ALL items within each section individually. Your suggestions must reference specific items by name/title (e.g. "In your Freelancer role at XYZ, add quantified achievements..." or "Your Software Engineer position at ABC lacks action verbs..."). Do NOT give generic suggestions — be specific about WHICH item needs WHAT improvement.

Be ACCURATE and CRITICAL. Do not inflate scores. Most sections should score 40-75. Only exceptional content gets 80+.

You must call the score_sections tool with your analysis.`;

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
          { role: "user", content: `Score each of these resume sections individually for ATS compatibility:\n\n${JSON.stringify(sectionSummaries, null, 2)}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "score_sections",
              description: "Return ATS scores and per-item feedback for each resume section",
              parameters: {
                type: "object",
                properties: {
                  section_scores: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        section_id: { type: "string", description: "The section UUID" },
                        section_type: { type: "string" },
                        section_title: { type: "string" },
                        score: { type: "integer", description: "Score 0-100" },
                        feedback: { type: "string", description: "Overall section-level feedback" },
                        item_feedback: {
                          type: "array",
                          description: "Individual feedback for EACH item within the section. One entry per item (job, degree, project, etc.)",
                          items: {
                            type: "object",
                            properties: {
                              item_title: { type: "string", description: "The title/name of this specific item (job title, degree, project name, skill category)" },
                              item_subtitle: { type: "string", description: "Subtitle if any (company name, institution, etc.)" },
                              item_score: { type: "integer", description: "Score 0-100 for this specific item" },
                              strengths: { type: "array", items: { type: "string" }, description: "What this item does well" },
                              improvements: { type: "array", items: { type: "string" }, description: "Specific improvements for this item" },
                              keywords_found: { type: "array", items: { type: "string" } },
                              keywords_missing: { type: "array", items: { type: "string" } }
                            },
                            required: ["item_title", "item_score", "improvements"]
                          }
                        },
                        keywords_found: {
                          type: "array",
                          items: { type: "string" },
                          description: "ATS-relevant keywords found across the whole section"
                        },
                        keywords_missing: {
                          type: "array",
                          items: { type: "string" },
                          description: "Important ATS keywords missing from this section"
                        }
                      },
                      required: ["section_id", "section_type", "section_title", "score", "feedback", "item_feedback", "keywords_found", "keywords_missing"]
                    }
                  }
                },
                required: ["section_scores"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "score_sections" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI scoring failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let parsed: any;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      parsed = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*"section_scores"[\s\S]*\}/);
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[0]); } catch { /* ignore */ }
      }
    }

    if (!parsed?.section_scores) {
      console.error("AI did not return scores:", JSON.stringify(aiData.choices?.[0]?.message).substring(0, 500));
      return new Response(JSON.stringify({ error: "AI did not return structured scores" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete old scores for this resume
    await supabase.from("ats_section_scores").delete().eq("resume_id", resumeId);

    // Insert new scores
    const scoresToInsert = parsed.section_scores.map((s: any) => ({
      user_id: user.id,
      resume_id: resumeId,
      section_id: s.section_id,
      section_type: s.section_type,
      section_title: s.section_title,
      score: Math.min(100, Math.max(0, s.score)),
      feedback: s.feedback,
      suggestions: s.item_feedback || [],
      keywords_found: s.keywords_found || [],
      keywords_missing: s.keywords_missing || [],
    }));

    const { error: insertError } = await supabase.from("ats_section_scores").insert(scoresToInsert);
    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save scores" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate overall score (weighted average)
    const totalScore = scoresToInsert.reduce((sum: number, s: any) => sum + s.score, 0);
    const overallScore = Math.round(totalScore / scoresToInsert.length);

    // Save to history
    await supabase.from("ats_score_history").insert({
      user_id: user.id,
      resume_id: resumeId,
      overall_score: overallScore,
      section_scores: scoresToInsert.map((s: any) => ({
        section_type: s.section_type,
        section_title: s.section_title,
        score: s.score,
      })),
    });

    return new Response(JSON.stringify({
      success: true,
      overall_score: overallScore,
      section_scores: scoresToInsert,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("ats-score error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
