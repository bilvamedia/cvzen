import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOLS = [
  {
    type: "function",
    function: {
      name: "compare_to_job",
      description:
        "Compare this candidate's skills and experience against a specific job description or requirements provided by the visitor. Return a fit analysis.",
      parameters: {
        type: "object",
        properties: {
          job_description: {
            type: "string",
            description: "The job description or requirements to compare against",
          },
          job_title: {
            type: "string",
            description: "The job title if mentioned",
          },
        },
        required: ["job_description"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "shortlist_candidate",
      description:
        "Shortlist this candidate for the recruiter. Only works if the visitor is an authenticated recruiter.",
      parameters: {
        type: "object",
        properties: {
          notes: {
            type: "string",
            description: "Optional notes about why the candidate is being shortlisted",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "schedule_interview",
      description:
        "Help the recruiter schedule an interview with this candidate. Only works if the visitor is an authenticated recruiter.",
      parameters: {
        type: "object",
        properties: {
          proposed_time: {
            type: "string",
            description: "Proposed interview date/time in ISO format or natural language",
          },
          mode: {
            type: "string",
            enum: ["video", "phone", "in_person"],
            description: "Interview mode",
          },
          duration_minutes: {
            type: "number",
            description: "Duration in minutes, default 60",
          },
          notes: {
            type: "string",
            description: "Any notes about the interview",
          },
        },
        required: ["proposed_time", "mode"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_matching_jobs",
      description:
        "Search for jobs on the platform that match this candidate's skills and experience.",
      parameters: {
        type: "object",
        properties: {
          focus_area: {
            type: "string",
            description: "Optional specific area or skill to focus the search on",
          },
        },
        additionalProperties: false,
      },
    },
  },
];

async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  context: {
    profileId: string;
    resumeText: string;
    supabase: ReturnType<typeof createClient>;
    recruiterId: string | null;
    isRecruiter: boolean;
  }
): Promise<string> {
  const { profileId, resumeText, supabase, recruiterId, isRecruiter } = context;

  switch (toolName) {
    case "compare_to_job": {
      const jobDesc = args.job_description as string;
      const jobTitle = (args.job_title as string) || "the specified role";

      // Use AI to do the comparison
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      const compResp = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content:
                  "You are a hiring expert. Compare the candidate's resume against the job requirements. Provide: 1) Overall fit score (1-10), 2) Matching skills, 3) Missing skills/gaps, 4) Recommendation. Be concise but thorough.",
              },
              {
                role: "user",
                content: `CANDIDATE RESUME:\n${resumeText}\n\nJOB REQUIREMENTS (${jobTitle}):\n${jobDesc}`,
              },
            ],
          }),
        }
      );
      const compData = await compResp.json();
      return compData.choices?.[0]?.message?.content || "Unable to complete comparison.";
    }

    case "shortlist_candidate": {
      if (!isRecruiter || !recruiterId) {
        return "⚠️ Only authenticated recruiters can shortlist candidates. Please sign in as a recruiter first.";
      }

      // Check if already shortlisted
      const { data: existing } = await supabase
        .from("shortlisted_candidates")
        .select("id")
        .eq("recruiter_id", recruiterId)
        .eq("candidate_profile_id", profileId)
        .maybeSingle();

      if (existing) {
        return "✅ This candidate is already on your shortlist!";
      }

      const { error } = await supabase.from("shortlisted_candidates").insert({
        recruiter_id: recruiterId,
        candidate_profile_id: profileId,
        notes: (args.notes as string) || "Shortlisted via CV chat agent",
      });

      if (error) {
        console.error("Shortlist error:", error);
        return "❌ Failed to shortlist candidate. Please try from the profile page.";
      }
      return "✅ Candidate has been shortlisted successfully! You can view your shortlist from your recruiter dashboard.";
    }

    case "schedule_interview": {
      if (!isRecruiter || !recruiterId) {
        return "⚠️ Only authenticated recruiters can schedule interviews. Please sign in as a recruiter first.";
      }

      const proposedTime = args.proposed_time as string;
      const mode = (args.mode as string) || "video";
      const duration = (args.duration_minutes as number) || 60;
      const notes = (args.notes as string) || "";

      // Parse the time
      let confirmedTime: string;
      try {
        const parsed = new Date(proposedTime);
        if (isNaN(parsed.getTime())) {
          return "⚠️ I couldn't understand that time. Please provide a date/time like '2026-04-15 2:00 PM' or 'next Tuesday at 3pm'.";
        }
        confirmedTime = parsed.toISOString();
      } catch {
        return "⚠️ Invalid date format. Please try again with a clear date and time.";
      }

      const { error } = await supabase.from("interviews").insert({
        recruiter_id: recruiterId,
        candidate_id: profileId,
        confirmed_time: confirmedTime,
        mode,
        duration_minutes: duration,
        notes: notes || `Interview scheduled via CV chat agent`,
        status: "pending",
        scheduling_type: "fixed",
      });

      if (error) {
        console.error("Interview scheduling error:", error);
        return "❌ Failed to schedule interview. Please try from your dashboard.";
      }
      return `✅ Interview request sent!\n- **When:** ${new Date(confirmedTime).toLocaleString()}\n- **Mode:** ${mode}\n- **Duration:** ${duration} minutes\n\nThe candidate will be notified and can accept or reschedule.`;
    }

    case "search_matching_jobs": {
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select("title, company, location, work_mode, employment_type, job_slug")
        .eq("status", "active")
        .limit(10);

      if (error || !jobs?.length) {
        return "No matching jobs found on the platform right now.";
      }

      const jobList = jobs
        .map(
          (j: any, i: number) =>
            `${i + 1}. **${j.title}** at ${j.company} (${j.work_mode}, ${j.location || "Remote"}) — [View Job](/jobs/${j.job_slug})`
        )
        .join("\n");

      return `Here are current openings that may match this candidate:\n\n${jobList}`;
    }

    default:
      return "Unknown tool.";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, profileId } = await req.json();

    if (!profileId) {
      return new Response(
        JSON.stringify({ error: "profileId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if caller is an authenticated recruiter
    const authHeader = req.headers.get("authorization");
    let recruiterId: string | null = null;
    let isRecruiter = false;

    if (authHeader) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const {
        data: { user },
      } = await userClient.auth.getUser();
      if (user) {
        recruiterId = user.id;
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "recruiter")
          .maybeSingle();
        isRecruiter = !!roleData;
      }
    }

    // Fetch profile and resume sections
    const { data: profileData } = await supabase
      .rpc("get_public_profile_by_slug", { _slug: "" })
      .limit(0); // We'll use profileId directly

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("full_name, headline, bio, avatar_url, linkedin_url, website_url")
      .eq("id", profileId)
      .single();

    const { data: sections } = await supabase.rpc("get_public_resume_sections", {
      _profile_id: profileId,
    });

    // Build resume text for context
    let resumeText = "";
    if (profileRow) {
      resumeText += `Name: ${profileRow.full_name || "Unknown"}\n`;
      if (profileRow.headline) resumeText += `Headline: ${profileRow.headline}\n`;
      if (profileRow.bio) resumeText += `About: ${profileRow.bio}\n`;
      resumeText += "\n";
    }

    if (sections && Array.isArray(sections)) {
      for (const s of sections) {
        const content = s.improved_content || s.content;
        const items = content?.items || [];
        resumeText += `\n## ${s.section_title}\n`;
        for (const item of items) {
          if (item.title) resumeText += `### ${item.title}`;
          if (item.subtitle) resumeText += ` — ${item.subtitle}`;
          resumeText += "\n";
          if (item.date_range) resumeText += `Period: ${item.date_range}\n`;
          if (item.location) resumeText += `Location: ${item.location}\n`;
          if (item.description) resumeText += `${item.description}\n`;
          if (item.details?.length) {
            for (const d of item.details) resumeText += `- ${d}\n`;
          }
          if (item.tags?.length) resumeText += `Skills: ${item.tags.join(", ")}\n`;
          resumeText += "\n";
        }
      }
    }

    const candidateName = profileRow?.full_name || "this candidate";

    const systemPrompt = `You are ${candidateName}'s AI assistant on their interactive CV page. You represent ${candidateName} professionally and answer questions about their background, skills, experience, and qualifications.

CANDIDATE PROFILE:
${resumeText}

INSTRUCTIONS:
- Answer questions about ${candidateName}'s skills, experience, education, projects, and qualifications based on the resume data above.
- Be professional, helpful, and enthusiastic about ${candidateName}'s capabilities.
- If asked about something not in the resume, say you don't have that information but suggest the visitor reach out to ${candidateName} directly.
- You have tools to: compare the candidate against job requirements, shortlist the candidate (recruiter only), schedule interviews (recruiter only), and search matching jobs.
- When a visitor asks to compare against a job or role, use the compare_to_job tool.
- When a recruiter wants to shortlist, use the shortlist_candidate tool.
- When a recruiter wants to schedule an interview, use the schedule_interview tool.
- When asked about matching jobs, use the search_matching_jobs tool.
- For non-recruiter visitors trying to shortlist or schedule: politely explain these are recruiter-only features and suggest they sign in as a recruiter.
- Keep responses concise and well-formatted with markdown.
- ${isRecruiter ? "The current visitor is an authenticated RECRUITER. They can shortlist and schedule interviews." : "The current visitor is NOT a recruiter. They cannot shortlist or schedule interviews."}`;

    // Initial AI call with tools
    let aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: aiMessages,
          tools: TOOLS,
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    let result = await response.json();
    let assistantMessage = result.choices?.[0]?.message;

    // Handle tool calls (loop up to 3 times for chained calls)
    let iterations = 0;
    while (assistantMessage?.tool_calls?.length && iterations < 3) {
      iterations++;
      const toolResults: Array<{ role: string; tool_call_id: string; content: string }> = [];

      for (const tc of assistantMessage.tool_calls) {
        const toolArgs = typeof tc.function.arguments === "string"
          ? JSON.parse(tc.function.arguments)
          : tc.function.arguments;

        const toolResult = await executeToolCall(tc.function.name, toolArgs, {
          profileId,
          resumeText,
          supabase,
          recruiterId,
          isRecruiter,
        });

        toolResults.push({
          role: "tool",
          tool_call_id: tc.id,
          content: toolResult,
        });
      }

      // Continue conversation with tool results
      aiMessages = [
        ...aiMessages,
        assistantMessage,
        ...toolResults,
      ];

      const followUp = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: aiMessages,
            tools: TOOLS,
            stream: false,
          }),
        }
      );

      result = await followUp.json();
      assistantMessage = result.choices?.[0]?.message;
    }

    const reply = assistantMessage?.content || "I'm sorry, I couldn't process that request.";

    return new Response(JSON.stringify({ reply, toolsUsed: iterations > 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-with-cv error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
