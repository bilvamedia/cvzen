import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { query, location, skills } = await req.json();

    const tavilyKey = Deno.env.get("TAVILY_API_KEY");
    if (!tavilyKey) {
      return new Response(JSON.stringify({ error: "Tavily not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build a rich search query from candidate data
    const skillsStr = Array.isArray(skills) ? skills.slice(0, 10).join(", ") : "";
    const searchQuery = [
      query || "job openings hiring",
      skillsStr ? `skills: ${skillsStr}` : "",
      location ? `location: ${location}` : "",
    ].filter(Boolean).join(" ");

    console.log("Tavily search query:", searchQuery);

    const tavilyResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: searchQuery,
        search_depth: "advanced",
        max_results: 15,
        include_answer: true,
        include_raw_content: false,
        include_domains: [
          "linkedin.com/jobs",
          "indeed.com",
          "glassdoor.com",
          "naukri.com",
          "wellfound.com",
          "remoteok.com",
          "weworkremotely.com",
          "dice.com",
          "monster.com",
          "simplyhired.com",
          "ziprecruiter.com",
          "lever.co",
          "greenhouse.io",
          "workday.com",
          "jobs.lever.co",
          "boards.greenhouse.io",
        ],
      }),
    });

    if (!tavilyResponse.ok) {
      const errText = await tavilyResponse.text();
      console.error("Tavily API error:", tavilyResponse.status, errText);
      return new Response(JSON.stringify({ error: `Tavily search failed: ${tavilyResponse.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tavilyData = await tavilyResponse.json();

    // Parse results into structured job listings
    const jobs = (tavilyData.results || []).map((result: any, idx: number) => {
      const url = result.url || "";
      const title = result.title || "Job Opening";
      const content = result.content || "";

      // Try to extract company from URL or title
      let company = "Unknown Company";
      const urlMatch = url.match(/(?:linkedin\.com\/jobs\/view\/.*?at-|glassdoor\.com\/.*?\/.*?-Reviews|indeed\.com\/cmp\/)([\w-]+)/i);
      if (urlMatch) {
        company = urlMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
      // Try extracting from title patterns like "Title at Company" or "Title - Company"
      const titleMatch = title.match(/(?:at|@|-|–|—|·|\|)\s*(.+?)(?:\s*[-–—·|]|$)/i);
      if (titleMatch) {
        company = titleMatch[1].trim();
      }

      // Extract location hints from content
      let location = null;
      const locMatch = content.match(/(?:Location|Based in|Remote|Hybrid|On-site)[:\s]*([^.·\n]{3,40})/i);
      if (locMatch) location = locMatch[1].trim();
      if (!location && /remote/i.test(content)) location = "Remote";

      return {
        id: `tavily-${idx}-${Date.now()}`,
        title: title.split(/[-–—·|]/)[0].trim() || title,
        company,
        location,
        description: content,
        url,
        source: new URL(url).hostname.replace("www.", ""),
      };
    });

    return new Response(JSON.stringify({
      jobs,
      answer: tavilyData.answer || null,
      query: searchQuery,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("External job search error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Search failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
