import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, Search, PlusCircle, Calendar, Sparkles, Users, ExternalLink, Star, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const navItems = [
  { label: "Dashboard", href: "/recruiter", icon: LayoutDashboard },
  { label: "Post Job", href: "/recruiter/post-job", icon: PlusCircle },
  { label: "My Jobs", href: "/recruiter/jobs", icon: FileText },
  { label: "Search Candidates", href: "/recruiter/search", icon: Search },
  { label: "Interviews", href: "/recruiter/interviews", icon: Calendar },
];

interface SearchResult {
  id: string;
  user_id: string;
  section_title: string;
  section_type: string;
  content: any;
  improved_content: any;
  similarity: number;
  profile?: { full_name: string | null; headline: string | null; profile_slug: string | null };
}

const CandidateSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      // Generate embedding for query
      const { data: embData, error: embErr } = await supabase.functions.invoke("generate-embeddings", {
        body: { text: query, mode: "search" },
      });
      if (embErr || !embData?.embedding) throw new Error("Failed to generate search embedding");

      const { data, error } = await supabase.rpc("search_resume_sections", {
        query_embedding: JSON.stringify(embData.embedding),
        match_threshold: 0.25,
        match_count: 20,
      });
      if (error) throw error;

      // Group by user and fetch profiles
      const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      let profiles: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: pData } = await supabase.from("profiles").select("id, full_name, headline, profile_slug").in("id", userIds);
        if (pData) pData.forEach((p: any) => { profiles[p.id] = p; });
      }

      const enriched = (data || []).map((r: any) => ({ ...r, profile: profiles[r.user_id] }));
      setResults(enriched);
      if (enriched.length === 0) toast({ title: "No matches", description: "Try a different search query." });
    } catch (err: any) {
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Deduplicate by user for a cleaner view
  const groupedByUser = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const key = r.user_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <DashboardLayout navItems={navItems} role="recruiter">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Semantic Candidate Search</h1>
        <p className="text-muted-foreground mb-6">Describe the ideal candidate — we'll search CVs by meaning.</p>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="e.g. 'ML engineer with production NLP experience in Python'"
              value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 h-11 enterprise-border"
            />
          </div>
          <Button variant="hero" onClick={handleSearch} disabled={loading} className="h-11">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Search
          </Button>
        </div>

        {!searched ? (
          <div className="bg-card rounded-xl p-12 shadow-card border border-border text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Enter a query to find semantically matching candidates.</p>
          </div>
        ) : loading ? (
          <div className="text-center py-12 text-muted-foreground">Searching...</div>
        ) : Object.keys(groupedByUser).length === 0 ? (
          <div className="bg-card rounded-xl p-12 shadow-card border border-border text-center">
            <p className="text-muted-foreground">No candidates matched your search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedByUser).map(([userId, sections]) => {
              const profile = sections[0]?.profile;
              const topSimilarity = Math.max(...sections.map(s => s.similarity));
              return (
                <div key={userId} className="bg-card rounded-xl p-5 shadow-card border border-border enterprise-border">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{profile?.full_name || "Anonymous"}</h3>
                      {profile?.headline && <p className="text-sm text-muted-foreground">{profile.headline}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <Star className="h-3 w-3 text-primary" />
                        {(topSimilarity * 100).toFixed(0)}% match
                      </Badge>
                      {profile?.profile_slug && (
                        <Link to={`/profile/${profile.profile_slug}`} target="_blank">
                          <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-3.5 w-3.5" /></Button>
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sections.slice(0, 4).map((s) => (
                      <Badge key={s.id} variant="secondary" className="text-[10px]">
                        {s.section_title} · {(s.similarity * 100).toFixed(0)}%
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CandidateSearch;
