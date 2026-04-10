import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CANDIDATE_SYSTEM_PROMPT = `You are Zen — the AI career assistant inside cvZen. You help candidates with:

- Resume & CV improvement tips
- Job search strategies and advice  
- Interview preparation and mock questions
- Career path planning and transitions
- Salary negotiation guidance
- LinkedIn & professional branding tips
- Cover letter writing help
- Skills gap analysis and upskilling suggestions

CONTEXT — the user is a logged-in candidate. You have access to their profile and resume data below.

INSTRUCTIONS:
- Be warm, encouraging, and actionable in your advice.
- When giving resume tips, reference their actual content.
- Keep responses concise but thorough. Use markdown formatting.
- If asked about recruiter-specific features, explain you're their career assistant.
- Never fabricate information about the user — only use what's provided.`;

const RECRUITER_SYSTEM_PROMPT = `You are Zen — the AI recruitment assistant inside cvZen. You help recruiters with:

- Writing compelling job descriptions
- Candidate evaluation and screening strategies
- Interview question design for specific roles
- Hiring best practices and compliance
- Employer branding and talent attraction
- Diversity & inclusion in hiring
- Offer letter and compensation benchmarking advice
- Recruitment pipeline optimization

CONTEXT — the user is a logged-in recruiter. You have access to their profile data below.

INSTRUCTIONS:
- Be professional, strategic, and data-driven in your advice.
- When helping with job descriptions, ask about role specifics.
- Keep responses concise but thorough. Use markdown formatting.
- If asked about candidate-specific features, explain you're their recruitment assistant.
- Never fabricate information — only use what's provided.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, role } = await req.json();

    if (!messages || !role) {
      return new Response(
        JSON.stringify({ error: "messages and role are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify role matches
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", role)
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Role mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user context
    let contextText = "";

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, headline, bio")
      .eq("id", user.id)
      .single();

    if (profile) {
      contextText += `User: ${profile.full_name || "Unknown"}\n`;
      if (profile.headline) contextText += `Headline: ${profile.headline}\n`;
      if (profile.bio) contextText += `Bio: ${profile.bio}\n`;
    }

    if (role === "candidate") {
      // Get resume sections
      const { data: sections } = await supabase.rpc("get_public_resume_sections", { _profile_id: user.id });
      if (sections && Array.isArray(sections)) {
        for (const s of sections) {
          const content = s.improved_content || s.content;
          const items = (content as any)?.items || [];
          contextText += `\n## ${s.section_title}\n`;
          for (const item of items) {
            if (item.title) contextText += `### ${item.title}`;
            if (item.subtitle) contextText += ` — ${item.subtitle}`;
            contextText += "\n";
            if (item.date_range) contextText += `Period: ${item.date_range}\n`;
            if (item.description) contextText += `${item.description}\n`;
            if (item.details?.length) {
              for (const d of item.details) contextText += `- ${d}\n`;
            }
            if (item.tags?.length) contextText += `Skills: ${item.tags.join(", ")}\n`;
          }
        }
      }

      // Get job preferences
      const { data: prefs } = await supabase.rpc("get_public_job_preferences", { _profile_id: user.id });
      const p = Array.isArray(prefs) ? prefs[0] : prefs;
      if (p) {
        contextText += "\n## Job Preferences\n";
        if (p.seniority_level) contextText += `Seniority: ${p.seniority_level}\n`;
        if (p.work_modes?.length) contextText += `Work Modes: ${p.work_modes.join(", ")}\n`;
        if (p.employment_types?.length) contextText += `Employment Types: ${p.employment_types.join(", ")}\n`;
        if (p.preferred_locations?.length) contextText += `Locations: ${p.preferred_locations.join(", ")}\n`;
        if (p.job_functions?.length) contextText += `Functions: ${p.job_functions.join(", ")}\n`;
        if (p.industries?.length) contextText += `Industries: ${p.industries.join(", ")}\n`;
        if (p.tools_technologies?.length) contextText += `Tools: ${p.tools_technologies.join(", ")}\n`;
      }
    } else {
      // Recruiter context: get their jobs
      const { data: jobs } = await supabase
        .from("jobs")
        .select("title, company, status, employment_type, work_mode, location")
        .eq("recruiter_id", user.id)
        .limit(20);

      if (jobs?.length) {
        contextText += "\n## Your Active Jobs\n";
        for (const j of jobs) {
          contextText += `- ${j.title} at ${j.company} (${j.status}, ${j.work_mode}, ${j.location || "Remote"})\n`;
        }
      }
    }

    const systemPrompt = role === "candidate" ? CANDIDATE_SYSTEM_PROMPT : RECRUITER_SYSTEM_PROMPT;

    // Stream response
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `${systemPrompt}\n\nUSER CONTEXT:\n${contextText}` },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      throw new Error("AI gateway error");
    }

    return new Response(resp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("zen-agent error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
