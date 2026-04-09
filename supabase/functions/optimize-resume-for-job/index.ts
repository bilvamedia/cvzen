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

    const { jobId } = await req.json();
    if (!jobId) {
      return new Response(JSON.stringify({ error: "jobId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch candidate's latest parsed resume sections
    const { data: resume } = await supabase
      .from("resumes")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "parsed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!resume) {
      return new Response(JSON.stringify({ error: "No parsed resume found. Please upload and parse your CV first." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: sections } = await supabase
      .from("resume_sections")
      .select("id, section_title, section_type, content, improved_content, display_order")
      .eq("resume_id", resume.id)
      .order("display_order", { ascending: true });

    if (!sections || sections.length === 0) {
      return new Response(JSON.stringify({ error: "No resume sections found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the resume content (prefer improved if available)
    const resumeContent = sections.map((s: any) => ({
      section_title: s.section_title,
      section_type: s.section_type,
      items: (s.improved_content?.items || s.content?.items || []),
    }));

    const jobSkills = Array.isArray(job.skills) ? (job.skills as string[]).join(", ") : "";

    const systemPrompt = `You are an expert resume optimization specialist. You will receive a candidate's resume sections and a job description. Your task is to optimize the resume content to better match the job requirements while:

1. PRESERVING all factual information (dates, companies, degrees, certifications)
2. Tailoring bullet points to highlight relevant experience for THIS specific job
3. Incorporating keywords from the job description naturally
4. Strengthening action verbs and adding quantified achievements where possible
5. Reordering or emphasizing skills that match the job requirements
6. Making the resume ATS-friendly for this specific role

Return the optimized sections using the tool provided. Each section should have the same structure but with improved content tailored to the job.`;

    const userMessage = `JOB DETAILS:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Required Skills: ${jobSkills}
Experience Level: ${job.experience_level || "Not specified"}
Employment Type: ${job.employment_type}

CANDIDATE'S CURRENT RESUME SECTIONS:
${JSON.stringify(resumeContent, null, 2)}

Optimize each resume section to best match this specific job. Keep all facts but tailor language, keywords, and emphasis.`;

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
              name: "return_optimized_resume",
              description: "Return the optimized resume sections",
              parameters: {
                type: "object",
                properties: {
                  sections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        section_title: { type: "string" },
                        section_type: { type: "string" },
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
                      required: ["section_title", "section_type", "items"],
                    },
                  },
                  match_score: {
                    type: "number",
                    description: "Estimated match percentage (0-100) between the optimized resume and the job",
                  },
                  optimization_summary: {
                    type: "string",
                    description: "Brief summary of key optimizations made",
                  },
                },
                required: ["sections", "match_score", "optimization_summary"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_optimized_resume" } },
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
      return new Response(JSON.stringify({ error: "AI optimization failed" }), {
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
      const jsonMatch = content.match(/\{[\s\S]*"sections"[\s\S]*\}/);
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[0]); } catch { /* ignore */ }
      }
    }

    if (!parsed?.sections) {
      return new Response(JSON.stringify({ error: "AI did not return optimized content" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      optimized_sections: parsed.sections,
      match_score: parsed.match_score || 0,
      optimization_summary: parsed.optimization_summary || "",
      original_sections: resumeContent,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("optimize-resume-for-job error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
