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
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { jobId } = await req.json();
    if (!jobId) {
      return new Response(JSON.stringify({ error: "jobId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch job details including recruiter_id
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("title, company, description, skills, experience_level, location, recruiter_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch recruiter/hiring manager name
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: recruiterProfile } = await serviceClient
      .from("profiles")
      .select("full_name")
      .eq("id", job.recruiter_id)
      .single();
    const hiringManagerName = recruiterProfile?.full_name || "Hiring Manager";

    // Fetch candidate profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, headline, bio")
      .eq("id", user.id)
      .single();

    // Fetch candidate resume sections
    const { data: resume } = await supabase
      .from("resumes")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "parsed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let resumeSummary = "";
    if (resume) {
      const { data: sections } = await supabase
        .from("resume_sections")
        .select("section_type, section_title, content, improved_content")
        .eq("resume_id", resume.id)
        .order("display_order");

      if (sections) {
        resumeSummary = sections.map((s) => {
          const c = s.improved_content || s.content;
          const items = Array.isArray(c) ? c : (c as any)?.items || [];
          const details = items.slice(0, 3).map((i: any) =>
            `${i.title || ""}${i.subtitle ? " - " + i.subtitle : ""}${i.description ? ": " + i.description : ""}`
          ).join("; ");
          return `${s.section_title}: ${details}`;
        }).join("\n");
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const skills = Array.isArray(job.skills) ? (job.skills as string[]).join(", ") : "";

    const systemPrompt = `You are an expert career coach who writes compelling, personalized cover letters. Write concise, professional cover letters (200-300 words) that:
- Open with genuine enthusiasm for the specific role and company
- Highlight 2-3 most relevant experiences/skills from the candidate's background that match the job
- Show understanding of the company's needs based on the job description
- Close with a confident call to action
- Use a professional but warm tone
- Do NOT use generic filler phrases like "I am writing to express my interest"
- Do NOT use markdown formatting, asterisks, or special characters
- Write in plain text paragraphs only`;

    const userPrompt = `Write a cover letter for this application:

JOB:
Title: ${job.title}
Company: ${job.company}
${job.location ? `Location: ${job.location}` : ""}
${job.experience_level ? `Level: ${job.experience_level}` : ""}
${skills ? `Key Skills: ${skills}` : ""}
Description: ${job.description.slice(0, 1500)}

CANDIDATE:
Name: ${profile?.full_name || "Candidate"}
${profile?.headline ? `Headline: ${profile.headline}` : ""}
${resumeSummary ? `Resume Summary:\n${resumeSummary}` : ""}`;

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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const coverLetter = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ cover_letter: coverLetter }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-cover-letter error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
