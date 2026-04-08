import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Extract text from DOCX (ZIP of XML files)
async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) throw new Error("Invalid DOCX: no word/document.xml found");
  // Strip XML tags to get plain text, preserve paragraph breaks
  return docXml
    .replace(/<w:p[^>]*>/g, "\n")
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

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

    const { data: resume, error: resumeError } = await supabase
      .from("resumes").select("*").eq("id", resumeId).eq("user_id", user.id).single();
    if (resumeError || !resume) {
      return new Response(JSON.stringify({ error: "Resume not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("resumes").download(resume.file_path);
    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ error: "Failed to download resume file" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("resumes").update({ status: "parsing" }).eq("id", resumeId);

    // Extract text based on file type
    const arrayBuffer = await fileData.arrayBuffer();
    const fileName = (resume.file_name || "").toLowerCase();
    let resumeText = "";

    if (fileName.endsWith(".docx")) {
      resumeText = await extractTextFromDocx(arrayBuffer);
    } else {
      // For PDF or other formats, send as base64 to multimodal model
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      resumeText = `[BASE64_PDF]${btoa(binary)}`;
    }

    console.log("Extracted text length:", resumeText.length);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert resume parser. Extract ALL sections from the resume into structured data.
IMPORTANT: Discover sections dynamically from the resume content. Do NOT use hardcoded section names.
Extract every section you find, preserving the original section title exactly as written.
You must call the extract_resume_sections tool with the parsed data.`;

    // Build user message content
    let userContent: any;
    if (resumeText.startsWith("[BASE64_PDF]")) {
      const b64 = resumeText.slice(12);
      userContent = [
        { type: "text", text: "Parse this resume PDF. Extract ALL sections dynamically." },
        { type: "image_url", image_url: { url: `data:application/pdf;base64,${b64}` } },
      ];
    } else {
      userContent = `Parse this resume text. Extract ALL sections dynamically.\n\n---\n${resumeText}\n---`;
    }

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
          { role: "user", content: userContent },
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
                  candidate_phone: { type: "string", description: "Phone number if found" },
                  candidate_headline: { type: "string", description: "Professional headline or title" },
                  candidate_linkedin: { type: "string", description: "LinkedIn URL if found" },
                  candidate_website: { type: "string", description: "Personal website or portfolio URL if found" },
                  candidate_address: { type: "string", description: "Location or address if found" },
                  sections: {
                    type: "array",
                    description: "All sections found in the resume, in order",
                    items: {
                      type: "object",
                      properties: {
                        section_type: { type: "string", description: "lowercase snake_case identifier" },
                        section_title: { type: "string", description: "Exact section title from resume" },
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
                              level: { type: "string" }
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
      await supabase.from("resumes").update({ status: "error" }).eq("id", resumeId);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI parsing failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    console.log("AI response choices:", JSON.stringify(aiData.choices?.[0]?.message).substring(0, 500));

    // Try tool_calls first, then fall back to parsing content
    let parsed: any;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      parsed = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to extract JSON from message content
      const content = aiData.choices?.[0]?.message?.content || "";
      console.log("No tool_calls, trying content fallback. Content:", content.substring(0, 500));
      const jsonMatch = content.match(/\{[\s\S]*"sections"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Try repairing
          let repaired = jsonMatch[0]
            .replace(/,\s*}/g, "}").replace(/,\s*]/g, "]")
            .replace(/[\x00-\x1F\x7F]/g, "");
          let braces = 0, brackets = 0;
          for (const c of repaired) { if (c === '{') braces++; if (c === '}') braces--; if (c === '[') brackets++; if (c === ']') brackets--; }
          while (brackets > 0) { repaired += ']'; brackets--; }
          while (braces > 0) { repaired += '}'; braces--; }
          parsed = JSON.parse(repaired);
        }
      }
    }

    if (!parsed?.sections) {
      await supabase.from("resumes").update({ status: "error" }).eq("id", resumeId);
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete old sections
    await supabase.from("resume_sections").delete().eq("resume_id", resumeId);

    const sectionsToInsert = parsed.sections.map((section: any, index: number) => ({
      resume_id: resumeId,
      user_id: user.id,
      section_type: section.section_type,
      section_title: section.section_title,
      content: { items: section.items },
      display_order: index,
    }));

    if (sectionsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("resume_sections").insert(sectionsToInsert);
      if (insertError) {
        console.error("Insert error:", insertError);
        await supabase.from("resumes").update({ status: "error" }).eq("id", resumeId);
        return new Response(JSON.stringify({ error: "Failed to save parsed sections" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    await supabase.from("resumes").update({ status: "parsed", parsed_at: new Date().toISOString() }).eq("id", resumeId);

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
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("parse-resume error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
