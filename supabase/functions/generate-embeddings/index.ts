import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Generates vector embeddings for resume sections, job descriptions, OR job preferences.
 * 
 * Resume mode:       { sectionIds: string[], column: "content" | "improved_content" }
 * Job mode:          { jobIds: string[] }
 * Preferences mode:  { preferencesUserId: string }
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
        const enrichedText = await enrichTextWithAI(text, "job_preferences", LOVABLE_API_KEY);
        const embedding = generateDeterministicEmbedding(enrichedText, 768);
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
          const enrichedText = await enrichTextWithAI(text, "job_description", LOVABLE_API_KEY);
          const embedding = generateDeterministicEmbedding(enrichedText, 768);
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
        const enrichedText = await enrichTextWithAI(text, section.section_type, LOVABLE_API_KEY);
        const embedding = generateDeterministicEmbedding(enrichedText, 768);
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

/** Convert job preferences to searchable text */
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

/** Convert job data to searchable text */
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

/** Convert section JSONB content to searchable text */
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

/** Use AI to expand text with semantic keywords for better matching */
async function enrichTextWithAI(text: string, sectionType: string, apiKey: string): Promise<string> {
  try {
    let systemPrompt: string;
    if (sectionType === "job_description") {
      systemPrompt = `You are a job description keyword expander. Given a job posting, output the original text PLUS related industry keywords, synonyms, required skill categories, and role variants. Keep output under 500 words. Output plain text only, no formatting.`;
    } else if (sectionType === "job_preferences") {
      systemPrompt = `You are a job preferences keyword expander. Given a candidate's job preferences, output the original text PLUS related industry keywords, role synonyms, skill categories, company type keywords, and location variants. This helps match candidates to relevant jobs. Keep output under 500 words. Output plain text only, no formatting.`;
    } else {
      systemPrompt = `You are a resume keyword expander. Given a resume section, output the original text PLUS related industry keywords, synonyms, and skill categories. Keep output under 500 words. Output plain text only, no formatting.`;
    }

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
          { role: "user", content: `Section type: ${sectionType}\n\n${text.substring(0, 3000)}` }
        ],
        temperature: 0,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      console.warn("AI enrichment failed, using raw text:", response.status);
      return text;
    }

    const data = await response.json();
    const enriched = data.choices?.[0]?.message?.content?.trim();
    return enriched || text;
  } catch (err) {
    console.warn("AI enrichment error, using raw text:", err);
    return text;
  }
}

/**
 * Generate a deterministic 768-dim embedding from text using a hash-based approach.
 */
function generateDeterministicEmbedding(text: string, dimensions: number): number[] {
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const words = normalized.split(" ");
  const embedding = new Float64Array(dimensions);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const posWeight = 1.0 / (1.0 + Math.log(1 + i));

    const h1 = hashString(word);
    embedding[Math.abs(h1) % dimensions] += posWeight * (h1 > 0 ? 1 : -1);

    if (i < words.length - 1) {
      const bigram = word + " " + words[i + 1];
      const h2 = hashString(bigram);
      embedding[Math.abs(h2) % dimensions] += posWeight * 0.7 * (h2 > 0 ? 1 : -1);
    }

    for (let j = 0; j <= word.length - 3; j++) {
      const tri = word.substring(j, j + 3);
      const h3 = hashString(tri);
      embedding[Math.abs(h3) % dimensions] += posWeight * 0.3 * (h3 > 0 ? 1 : -1);
    }
  }

  let norm = 0;
  for (let i = 0; i < dimensions; i++) norm += embedding[i] * embedding[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) embedding[i] /= norm;
  }

  return Array.from(embedding);
}

/** Simple string hash function (FNV-1a variant) */
function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash | 0;
}
