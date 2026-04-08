import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey || !anonKey) {
      console.error("Missing env vars:", { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey, hasAnon: !!anonKey });
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
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

    // Fetch resume record
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .single();

    if (resumeError || !resume) {
      return new Response(JSON.stringify({ error: "Resume not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("resumes")
      .download(resume.file_path);

    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ error: "Failed to download resume file" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract text from file (convert to base64 for AI)
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Update status to parsing
    await supabase.from("resumes").update({ status: "parsing" }).eq("id", resumeId);

    // Call Lovable AI to parse resume
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert resume parser. You will receive the base64-encoded content of a resume file. Extract ALL sections from the resume into structured data.

IMPORTANT RULES:
- Do NOT use hardcoded section names. Discover sections dynamically from the resume content.
- Common sections include things like Summary, Experience, Education, Skills, Projects, Certifications, Awards, Languages, Volunteer Work, Publications, Interests, References — but the resume may have ANY section names.
- Extract every section you find, preserving the original section title exactly as written.
- For each section, provide structured content as JSON.

You must call the extract_resume_sections tool with the parsed data.`;

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
            content: `Parse this resume (base64 encoded PDF/DOCX). Extract ALL sections dynamically. The file is base64 encoded:\n\n${base64}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_resume_sections",
              description: "Extract all sections from a resume dynamically",
              parameters: {
                type: "object",
                properties: {
                  candidate_name: { type: "string", description: "Full name of the candidate" },
                  candidate_email: { type: "string", description: "Email if found" },
                  candidate_headline: { type: "string", description: "Professional headline or title" },
                  sections: {
                    type: "array",
                    description: "All sections found in the resume, in order",
                    items: {
                      type: "object",
                      properties: {
                        section_type: {
                          type: "string",
                          description: "A lowercase snake_case identifier for this section type, e.g. work_experience, education, skills, projects, certifications, summary, volunteer_work, publications, awards, languages, interests, references, or any other type found"
                        },
                        section_title: {
                          type: "string",
                          description: "The exact section title as it appears in the resume"
                        },
                        items: {
                          type: "array",
                          description: "Array of items in this section. Each item is a flexible object with relevant fields.",
                          items: {
                            type: "object",
                            properties: {
                              title: { type: "string", description: "Primary title (job title, degree, project name, skill category, etc.)" },
                              subtitle: { type: "string", description: "Secondary info (company, institution, etc.)" },
                              date_range: { type: "string", description: "Date range if applicable" },
                              location: { type: "string", description: "Location if applicable" },
                              description: { type: "string", description: "Main description or summary text" },
                              details: {
                                type: "array",
                                items: { type: "string" },
                                description: "Bullet points or detail items"
                              },
                              tags: {
                                type: "array",
                                items: { type: "string" },
                                description: "Tags, skills, or keywords associated with this item"
                              },
                              url: { type: "string", description: "URL if applicable" },
                              level: { type: "string", description: "Proficiency level if applicable" }
                            },
                            additionalProperties: true
                          }
                        }
                      },
                      required: ["section_type", "section_title", "items"]
                    }
                  }
                },
                required: ["sections"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_resume_sections" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      
      if (aiResponse.status === 429) {
        await supabase.from("resumes").update({ status: "error" }).eq("id", resumeId);
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        await supabase.from("resumes").update({ status: "error" }).eq("id", resumeId);
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("resumes").update({ status: "error" }).eq("id", resumeId);
      return new Response(JSON.stringify({ error: "AI parsing failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      await supabase.from("resumes").update({ status: "error" }).eq("id", resumeId);
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    // Delete old sections for this resume
    await supabase.from("resume_sections").delete().eq("resume_id", resumeId);

    // Insert all parsed sections dynamically
    const sectionsToInsert = parsed.sections.map((section: any, index: number) => ({
      resume_id: resumeId,
      user_id: user.id,
      section_type: section.section_type,
      section_title: section.section_title,
      content: { items: section.items },
      display_order: index,
    }));

    if (sectionsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("resume_sections")
        .insert(sectionsToInsert);

      if (insertError) {
        console.error("Insert error:", insertError);
        await supabase.from("resumes").update({ status: "error" }).eq("id", resumeId);
        return new Response(JSON.stringify({ error: "Failed to save parsed sections" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Update resume status and profile
    await supabase.from("resumes").update({
      status: "parsed",
      parsed_at: new Date().toISOString(),
    }).eq("id", resumeId);

    // Update profile with extracted info
    const profileUpdate: Record<string, string> = {};
    if (parsed.candidate_name) profileUpdate.full_name = parsed.candidate_name;
    if (parsed.candidate_email) profileUpdate.email = parsed.candidate_email;
    if (parsed.candidate_headline) profileUpdate.headline = parsed.candidate_headline;

    if (Object.keys(profileUpdate).length > 0) {
      await supabase.from("profiles").update(profileUpdate).eq("id", user.id);
    }

    return new Response(JSON.stringify({
      success: true,
      sections_count: sectionsToInsert.length,
      candidate_name: parsed.candidate_name,
      sections: parsed.sections.map((s: any) => ({
        type: s.section_type,
        title: s.section_title,
      })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("parse-resume error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
