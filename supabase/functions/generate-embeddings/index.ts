import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Generates production-grade semantic vector embeddings using Lovable AI.
 * Uses structured output (tool calling) to extract semantic features,
 * then maps them into dense 768-dimensional vectors for pgvector similarity search.
 *
 * Modes:
 *   Resume:      { sectionIds: string[], column: "content" | "improved_content" }
 *   Job:         { jobIds: string[] }
 *   Preferences: { preferencesUserId: string }
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

    const body = await req.json();
    const { sectionIds, column, jobIds, preferencesUserId } = body;

    // ── Job Preferences embedding mode ──
    if (preferencesUserId) {
      if (preferencesUserId !== user.id) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: prefRow, error: prefError } = await supabase
        .from("job_preferences")
        .select("*")
        .eq("user_id", preferencesUserId)
        .maybeSingle();

      if (prefError || !prefRow) {
        return new Response(JSON.stringify({ error: "Preferences not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const text = preferencesToText(prefRow);
      if (!text) {
        return new Response(JSON.stringify({ success: true, embedded: 0, total: 1 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      try {
        const embedding = await generateSemanticEmbedding(text, "job_preferences", LOVABLE_API_KEY);
        const vectorStr = `[${embedding.join(",")}]`;

        const { error: updateError } = await supabase
          .from("job_preferences")
          .update({ preferences_embedding: vectorStr })
          .eq("user_id", preferencesUserId);

        if (updateError) {
          console.error("Update error for preferences:", updateError);
          return new Response(JSON.stringify({ success: false, error: "Failed to save embedding" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log("Embedded job preferences for user:", preferencesUserId);
        return new Response(JSON.stringify({ success: true, embedded: 1, total: 1 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("Embedding error for preferences:", err);
        return new Response(JSON.stringify({ error: "Embedding generation failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Job embedding mode ──
    if (jobIds && Array.isArray(jobIds) && jobIds.length > 0) {
      const { data: jobs, error: fetchError } = await supabase
        .from("jobs")
        .select("id, title, company, description, location, skills, employment_type, experience_level, work_mode")
        .in("id", jobIds)
        .eq("recruiter_id", user.id);

      if (fetchError || !jobs || jobs.length === 0) {
        return new Response(JSON.stringify({ error: "Jobs not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let updated = 0;
      for (const job of jobs) {
        const text = jobToText(job);
        if (!text) continue;

        try {
          const embedding = await generateSemanticEmbedding(text, "job_description", LOVABLE_API_KEY);
          const vectorStr = `[${embedding.join(",")}]`;

          const { error: updateError } = await supabase
            .from("jobs")
            .update({ description_embedding: vectorStr })
            .eq("id", job.id);

          if (updateError) {
            console.error("Update error for job", job.id, updateError);
          } else {
            updated++;
          }
        } catch (err) {
          console.error("Embedding error for job", job.id, err);
        }
      }

      console.log(`Embedded ${updated}/${jobs.length} jobs`);
      return new Response(JSON.stringify({ success: true, embedded: updated, total: jobs.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Resume section embedding mode ──
    if (!sectionIds || !Array.isArray(sectionIds) || sectionIds.length === 0) {
      return new Response(JSON.stringify({ error: "sectionIds, jobIds, or preferencesUserId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!column || !["content", "improved_content"].includes(column)) {
      return new Response(JSON.stringify({ error: "column must be 'content' or 'improved_content'" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const embeddingColumn = column === "content" ? "content_embedding" : "improved_content_embedding";
    let updated = 0;

    for (const section of sections) {
      const data = column === "content" ? section.content : section.improved_content;
      if (!data) continue;

      const text = sectionToText(section.section_title, data);
      if (!text) continue;

      try {
        const embedding = await generateSemanticEmbedding(text, section.section_type, LOVABLE_API_KEY);
        const vectorStr = `[${embedding.join(",")}]`;

        const { error: updateError } = await supabase
          .from("resume_sections")
          .update({ [embeddingColumn]: vectorStr })
          .eq("id", section.id);

        if (updateError) {
          console.error("Update error for section", section.id, updateError);
        } else {
          updated++;
        }
      } catch (err) {
        console.error("Embedding error for section", section.id, err);
      }
    }

    console.log(`Embedded ${updated}/${sections.length} sections (${column})`);

    return new Response(JSON.stringify({
      success: true,
      embedded: updated,
      total: sections.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("generate-embeddings error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ────────────────────── Text extraction helpers ──────────────────────

function preferencesToText(pref: any): string {
  const parts: string[] = [];
  if (pref.seniority_level) parts.push(`Seniority: ${pref.seniority_level}`);
  if (pref.work_modes?.length) parts.push(`Work modes: ${pref.work_modes.join(", ")}`);
  if (pref.employment_types?.length) parts.push(`Employment types: ${pref.employment_types.join(", ")}`);
  if (pref.preferred_locations?.length) parts.push(`Preferred locations: ${pref.preferred_locations.join(", ")}`);
  if (pref.job_functions?.length) parts.push(`Job functions: ${pref.job_functions.join(", ")}`);
  if (pref.industries?.length) parts.push(`Industries: ${pref.industries.join(", ")}`);
  if (pref.tools_technologies?.length) parts.push(`Tools & Technologies: ${pref.tools_technologies.join(", ")}`);
  if (pref.company_sizes?.length) parts.push(`Company sizes: ${pref.company_sizes.join(", ")}`);
  if (pref.languages?.length) parts.push(`Languages: ${pref.languages.join(", ")}`);
  if (pref.shift_preference) parts.push(`Shift: ${pref.shift_preference}`);
  if (pref.notice_period) parts.push(`Notice period: ${pref.notice_period}`);
  if (pref.travel_willingness) parts.push(`Travel: ${pref.travel_willingness}`);
  if (pref.expected_salary_min || pref.expected_salary_max) {
    const cur = pref.salary_currency || "USD";
    const min = pref.expected_salary_min ? `${cur} ${pref.expected_salary_min}` : "";
    const max = pref.expected_salary_max ? `${cur} ${pref.expected_salary_max}` : "";
    parts.push(`Salary: ${min}${min && max ? " - " : ""}${max}`);
  }
  if (pref.benefits_priorities?.length) parts.push(`Benefits priorities: ${pref.benefits_priorities.join(", ")}`);
  if (pref.willing_to_relocate) parts.push("Willing to relocate");
  if (pref.visa_sponsorship_needed) parts.push("Needs visa sponsorship");
  return parts.join(". ");
}

function jobToText(job: any): string {
  const parts = [job.title, job.company];
  if (job.location) parts.push(job.location);
  if (job.work_mode) parts.push(job.work_mode);
  if (job.employment_type) parts.push(job.employment_type);
  if (job.experience_level) parts.push(job.experience_level);
  if (job.description) parts.push(job.description.substring(0, 4000));
  if (Array.isArray(job.skills)) parts.push(job.skills.join(" "));
  return parts.join(" ").trim();
}

function sectionToText(title: string, data: any): string {
  const items = data?.items || [];
  const parts = [title];
  for (const item of items) {
    if (item.title) parts.push(item.title);
    if (item.subtitle) parts.push(item.subtitle);
    if (item.description) parts.push(item.description);
    if (Array.isArray(item.details)) parts.push(...item.details);
    if (Array.isArray(item.tags)) parts.push(item.tags.join(" "));
    if (item.date_range) parts.push(item.date_range);
    if (item.location) parts.push(item.location);
    if (item.level) parts.push(item.level);
  }
  return parts.join(" ").trim();
}

// ────────────────────── Semantic Embedding Engine ──────────────────────

/**
 * The 96 semantic dimensions we score every text on.
 * Each dimension is rated 0.0–1.0 by the AI, then expanded
 * to a 768-dim vector (96 × 8 sub-features via deterministic projection).
 */
const SEMANTIC_DIMENSIONS = [
  // Technical Skills (24)
  "web_frontend", "web_backend", "mobile_development", "cloud_infrastructure",
  "devops_cicd", "databases_sql", "databases_nosql", "machine_learning",
  "data_science", "data_engineering", "cybersecurity", "networking",
  "embedded_systems", "game_development", "blockchain", "api_design",
  "testing_qa", "system_design", "low_level_programming", "scripting_automation",
  "ui_ux_design", "technical_writing", "version_control", "containerization",
  // Domain/Industry (16)
  "finance_banking", "healthcare_medical", "ecommerce_retail", "education",
  "media_entertainment", "manufacturing", "logistics_supply_chain", "real_estate",
  "legal", "government_public", "telecom", "energy_utilities",
  "agriculture", "automotive", "travel_hospitality", "nonprofit_social",
  // Role & Seniority (12)
  "entry_level", "mid_level", "senior_level", "lead_principal",
  "management", "executive_cxo", "individual_contributor", "team_collaboration",
  "mentoring_coaching", "strategic_planning", "hands_on_technical", "cross_functional",
  // Soft Skills (12)
  "communication", "leadership", "problem_solving", "creativity",
  "adaptability", "project_management", "analytical_thinking", "customer_facing",
  "negotiation", "time_management", "conflict_resolution", "presentation",
  // Work Preferences (12)
  "remote_work", "onsite_work", "hybrid_work", "startup_environment",
  "enterprise_corporate", "freelance_consulting", "full_time", "part_time",
  "contract_temporary", "international_global", "travel_required", "flexible_schedule",
  // Compensation & Benefits (8)
  "high_compensation", "equity_stock", "work_life_balance", "career_growth",
  "learning_development", "health_benefits", "retirement_benefits", "relocation_support",
  // Tools & Platforms (12)
  "aws_cloud", "azure_cloud", "gcp_cloud", "kubernetes_docker",
  "react_angular_vue", "python_ecosystem", "java_jvm", "dotnet_csharp",
  "nodejs_typescript", "golang_rust", "salesforce_crm", "sap_erp",
];

/**
 * Deterministic projection matrix seed — expands 96 AI scores into 768 dims.
 * Uses seeded pseudo-random to create consistent projections.
 */
function getProjectionVector(dimIndex: number, subIndex: number): number[] {
  const seed = dimIndex * 8 + subIndex;
  const vec = new Array(8).fill(0);
  // Lehmer RNG for deterministic projection
  let state = (seed + 1) * 48271;
  for (let i = 0; i < 8; i++) {
    state = (state * 48271) % 2147483647;
    vec[i] = ((state / 2147483647) * 2 - 1); // range [-1, 1]
  }
  return vec;
}

/**
 * Generate a 768-dim semantic embedding using Lovable AI.
 * 1. AI scores the text on 96 semantic dimensions (0.0–1.0)
 * 2. Scores are projected into 768-dim space via deterministic matrix
 * 3. Vector is L2-normalized for cosine similarity
 */
async function generateSemanticEmbedding(
  text: string,
  contextType: string,
  apiKey: string
): Promise<number[]> {
  const scores = await extractSemanticScores(text, contextType, apiKey);
  return projectTo768(scores);
}

async function extractSemanticScores(
  text: string,
  contextType: string,
  apiKey: string
): Promise<number[]> {
  const contextLabel = contextType === "job_description"
    ? "job posting"
    : contextType === "job_preferences"
    ? "candidate's job preferences"
    : "resume section";

  const systemPrompt = `You are a semantic analysis engine. Given a ${contextLabel}, score it on exactly 96 predefined semantic dimensions. Each score is a float from 0.0 (not relevant at all) to 1.0 (highly relevant). Be precise and nuanced — use the full range. A score of 0.0 means the dimension is completely irrelevant; 0.3-0.5 means somewhat relevant; 0.7-0.9 means strongly relevant; 1.0 means it's a core focus.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text.substring(0, 4000) },
      ],
      temperature: 0,
      tools: [
        {
          type: "function",
          function: {
            name: "score_semantic_dimensions",
            description: "Score the text on 96 semantic dimensions. Return exactly 96 float values between 0.0 and 1.0, in the exact order specified.",
            parameters: {
              type: "object",
              properties: Object.fromEntries(
                SEMANTIC_DIMENSIONS.map((dim) => [
                  dim,
                  { type: "number", description: `Relevance score (0.0-1.0) for: ${dim.replace(/_/g, " ")}` },
                ])
              ),
              required: SEMANTIC_DIMENSIONS,
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "score_semantic_dimensions" } },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI scoring failed:", response.status, errText);
    throw new Error(`AI scoring failed: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    console.error("No tool call in response:", JSON.stringify(data).substring(0, 500));
    throw new Error("AI did not return structured scores");
  }

  let args: Record<string, number>;
  try {
    args = typeof toolCall.function.arguments === "string"
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;
  } catch {
    throw new Error("Failed to parse AI scores");
  }

  // Extract scores in order, default to 0.0 if missing
  return SEMANTIC_DIMENSIONS.map((dim) => {
    const val = Number(args[dim]);
    return isNaN(val) ? 0.0 : Math.max(0, Math.min(1, val));
  });
}

/**
 * Project 96 semantic scores into a 768-dimensional embedding.
 * Each score is expanded to 8 sub-dimensions using a deterministic projection,
 * then the full vector is L2-normalized.
 */
function projectTo768(scores: number[]): number[] {
  const embedding = new Float64Array(768);

  for (let d = 0; d < 96; d++) {
    const score = scores[d];
    if (score === 0) continue;

    const baseIdx = d * 8;
    const projection = getProjectionVector(d, 0);

    for (let s = 0; s < 8; s++) {
      embedding[baseIdx + s] = score * projection[s];
    }
  }

  // L2 normalize
  let norm = 0;
  for (let i = 0; i < 768; i++) norm += embedding[i] * embedding[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < 768; i++) embedding[i] /= norm;
  }

  return Array.from(embedding);
}
