import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  LayoutDashboard, FileText, User, Search, Target, Calendar,
  Sparkles, MapPin, Building2, Clock, Briefcase, ChevronDown, ChevronUp,
  Loader2, Send, Wand2, CheckCircle2, XCircle, Eye, ArrowRight,
  DollarSign, Star, BadgeCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { label: "Dashboard", href: "/candidate", icon: LayoutDashboard },
  { label: "My CV", href: "/candidate/resume", icon: FileText },
  { label: "Digital Profile", href: "/candidate/profile", icon: User },
  { label: "ATS Score", href: "/candidate/ats-score", icon: Target },
  { label: "Search Jobs", href: "/candidate/search", icon: Search },
  { label: "Interviews", href: "/candidate/interviews", icon: Calendar },
  { label: "Billing", href: "/candidate/billing", icon: CreditCard },
  { label: "Settings", href: "/candidate/settings", icon: SettingsIcon },
];

interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string;
  employment_type: string;
  experience_level: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  skills: any;
  created_at: string;
  status: string;
}

interface OptimizedSection {
  section_title: string;
  section_type: string;
  items: any[];
}

const employmentLabels: Record<string, string> = {
  full_time: "Full Time", part_time: "Part Time", contract: "Contract",
  freelance: "Freelance", internship: "Internship",
};

const JobSearch = () => {
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());

  // Optimize & Apply state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedSections, setOptimizedSections] = useState<OptimizedSection[]>([]);
  const [originalSections, setOriginalSections] = useState<OptimizedSection[]>([]);
  const [matchScore, setMatchScore] = useState(0);
  const [optimizationSummary, setOptimizationSummary] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [viewMode, setViewMode] = useState<"optimized" | "original">("optimized");

  const { toast } = useToast();

  // Fetch already-applied jobs
  useEffect(() => {
    const fetchApplied = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("job_applications")
        .select("job_id")
        .eq("candidate_id", user.id);
      if (data) setAppliedJobs(new Set(data.map((a) => a.job_id)));
    };
    fetchApplied();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);

    // Search active jobs - simple text match for now, semantic later
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to search jobs.", variant: "destructive" });
      setSearching(false);
      return;
    }

    // Client-side relevance scoring based on query terms
    const queryTerms = query.toLowerCase().split(/\s+/);
    const scored = (data || []).map((job) => {
      const searchable = `${job.title} ${job.company} ${job.description} ${job.location || ""} ${
        Array.isArray(job.skills) ? (job.skills as string[]).join(" ") : ""
      } ${job.experience_level || ""} ${job.employment_type}`.toLowerCase();

      let score = 0;
      queryTerms.forEach((term) => {
        if (searchable.includes(term)) score += 1;
        if (job.title.toLowerCase().includes(term)) score += 2;
        if (Array.isArray(job.skills) && (job.skills as string[]).some((s) => s.toLowerCase().includes(term))) score += 1.5;
      });
      return { ...job, _score: score };
    });

    scored.sort((a, b) => b._score - a._score);
    setJobs(scored.filter((j) => j._score > 0).length > 0
      ? scored.filter((j) => j._score > 0)
      : scored.slice(0, 20) // show recent if no matches
    );
    setSearching(false);
  };

  const handleOptimizeAndApply = async (job: Job) => {
    setSelectedJob(job);
    setShowApplyDialog(true);
    setOptimizing(true);
    setOptimizedSections([]);
    setOriginalSections([]);
    setMatchScore(0);
    setOptimizationSummary("");
    setCoverLetter("");
    setViewMode("optimized");

    try {
      const { data, error } = await supabase.functions.invoke("optimize-resume-for-job", {
        body: { jobId: job.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setOptimizedSections(data.optimized_sections || []);
      setOriginalSections(data.original_sections || []);
      setMatchScore(data.match_score || 0);
      setOptimizationSummary(data.optimization_summary || "");
    } catch (err: any) {
      toast({
        title: "Optimization Failed",
        description: err.message || "Could not optimize resume. Please ensure you have a parsed CV.",
        variant: "destructive",
      });
      setShowApplyDialog(false);
    } finally {
      setOptimizing(false);
    }
  };

  const handleApply = async () => {
    if (!selectedJob) return;
    setApplying(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("job_applications").insert({
        candidate_id: user.id,
        job_id: selectedJob.id,
        cover_letter: coverLetter || null,
        optimized_resume_snapshot: optimizedSections as any,
        match_score: matchScore,
        status: "applied",
      } as any);

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already Applied", description: "You've already applied to this job.", variant: "destructive" });
        } else {
          throw error;
        }
      } else {
        setAppliedJobs((prev) => new Set([...prev, selectedJob.id]));
        toast({ title: "Application Submitted! 🎉", description: `Your optimized CV has been sent to ${selectedJob.company}.` });
        setShowApplyDialog(false);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to submit application.", variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-orange-600";
  };

  const getMatchBg = (score: number) => {
    if (score >= 80) return "bg-green-100 border-green-200";
    if (score >= 60) return "bg-yellow-100 border-yellow-200";
    return "bg-orange-100 border-orange-200";
  };

  return (
    <DashboardLayout navItems={navItems} role="candidate">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Find & Apply to Jobs</h1>
        <p className="text-muted-foreground mb-6">
          Search jobs, optimize your CV for each role, and apply with a tailored resume.
        </p>

        {/* Search Bar */}
        <div className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="e.g. 'senior backend engineer microservices' or 'product manager fintech'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={searching} variant="hero">
            {searching ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Search
          </Button>
        </div>

        {/* Results */}
        {!searched ? (
          <div className="bg-card rounded-xl p-12 shadow-card border border-border text-center">
            <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Search for jobs to see matching opportunities and apply with an AI-optimized CV.</p>
          </div>
        ) : searching ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-card rounded-xl p-12 shadow-card border border-border text-center">
            <XCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No matching jobs found. Try different keywords.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{jobs.length} job{jobs.length !== 1 ? "s" : ""} found</p>
            {jobs.map((job) => {
              const isExpanded = expandedJob === job.id;
              const hasApplied = appliedJobs.has(job.id);
              const skills = Array.isArray(job.skills) ? (job.skills as string[]) : [];

              return (
                <div key={job.id} className="border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Job Header */}
                  <div
                    className="p-4 sm:p-5 cursor-pointer"
                    onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <h3 className="font-semibold text-base">{job.title}</h3>
                          {hasApplied && (
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Applied
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" /> {job.company}
                          </span>
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" /> {job.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" /> {employmentLabels[job.employment_type] || job.employment_type}
                          </span>
                          {job.salary_min && job.salary_max && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5" />
                              {job.salary_min.toLocaleString()}-{job.salary_max.toLocaleString()} {job.salary_currency || "USD"}
                            </span>
                          )}
                        </div>
                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {skills.slice(0, 6).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                            ))}
                            {skills.length > 6 && (
                              <Badge variant="outline" className="text-xs">+{skills.length - 6}</Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!hasApplied && (
                          <Button
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleOptimizeAndApply(job); }}
                            className="gap-1 hidden sm:flex"
                          >
                            <Wand2 className="h-3.5 w-3.5" /> Optimize & Apply
                          </Button>
                        )}
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Description */}
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t">
                      <div className="pt-4 space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Job Description</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                            {job.description}
                          </p>
                        </div>
                        {job.experience_level && (
                          <div className="flex items-center gap-2 text-sm">
                            <Star className="h-4 w-4 text-primary" />
                            <span className="font-medium">Experience:</span>
                            <span className="text-muted-foreground capitalize">{job.experience_level.replace("_", " ")}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Posted {new Date(job.created_at).toLocaleDateString()}
                        </p>
                        {!hasApplied && (
                          <Button onClick={() => handleOptimizeAndApply(job)} className="gap-2 w-full sm:w-auto">
                            <Wand2 className="h-4 w-4" /> Optimize CV & Apply
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Optimize & Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={(open) => !optimizing && setShowApplyDialog(open)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              {optimizing ? "Optimizing Your CV..." : "Review & Apply"}
            </DialogTitle>
          </DialogHeader>

          {optimizing ? (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <div>
                <p className="font-medium">AI is tailoring your CV for this role</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Analyzing job requirements and optimizing your resume sections...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              {/* Job Info */}
              {selectedJob && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold">{selectedJob.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedJob.company}{selectedJob.location ? ` • ${selectedJob.location}` : ""}</p>
                </div>
              )}

              {/* Match Score */}
              <div className={`rounded-lg p-4 border ${getMatchBg(matchScore)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium flex items-center gap-2">
                    <BadgeCheck className="h-5 w-5" /> Match Score
                  </span>
                  <span className={`text-2xl font-bold ${getMatchColor(matchScore)}`}>
                    {Math.round(matchScore)}%
                  </span>
                </div>
                <Progress value={matchScore} className="h-2" />
                {optimizationSummary && (
                  <p className="text-sm mt-3 text-muted-foreground">{optimizationSummary}</p>
                )}
              </div>

              {/* View Toggle */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={viewMode === "optimized" ? "default" : "outline"}
                  onClick={() => setViewMode("optimized")}
                  className="gap-1"
                >
                  <Wand2 className="h-3.5 w-3.5" /> Optimized CV
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "original" ? "default" : "outline"}
                  onClick={() => setViewMode("original")}
                  className="gap-1"
                >
                  <Eye className="h-3.5 w-3.5" /> Original CV
                </Button>
              </div>

              {/* Resume Sections Preview */}
              <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                {(viewMode === "optimized" ? optimizedSections : originalSections).map((section, idx) => (
                  <div key={idx} className="border-b last:border-0 pb-3 last:pb-0">
                    <h4 className="font-semibold text-sm flex items-center gap-2 mb-1.5">
                      {section.section_title}
                      {viewMode === "optimized" && (
                        <Badge className="bg-primary/10 text-primary text-[10px] border-0">AI Optimized</Badge>
                      )}
                    </h4>
                    {section.items.slice(0, 3).map((item: any, iIdx: number) => (
                      <div key={iIdx} className="ml-3 mb-1.5">
                        <p className="text-sm font-medium">{item.title}</p>
                        {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>
                        )}
                        {Array.isArray(item.details) && item.details.length > 0 && (
                          <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                            {item.details.slice(0, 2).map((d: string, dIdx: number) => (
                              <li key={dIdx} className="flex items-start gap-1">
                                <span className="text-primary mt-0.5">•</span>
                                <span className="line-clamp-1">{d}</span>
                              </li>
                            ))}
                            {item.details.length > 2 && (
                              <li className="text-muted-foreground/60">+{item.details.length - 2} more</li>
                            )}
                          </ul>
                        )}
                      </div>
                    ))}
                    {section.items.length > 3 && (
                      <p className="text-xs text-muted-foreground ml-3">+{section.items.length - 3} more items</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Cover Letter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm font-medium">Cover Letter</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!selectedJob) return;
                      setGeneratingCoverLetter(true);
                      try {
                        const { data, error } = await supabase.functions.invoke("generate-cover-letter", {
                          body: { jobId: selectedJob.id },
                        });
                        if (error) throw error;
                        if (data?.error) throw new Error(data.error);
                        setCoverLetter(data.cover_letter || "");
                        toast({ title: "Cover Letter Generated", description: "AI has crafted a personalized cover letter. Feel free to edit it." });
                      } catch (err: any) {
                        toast({ title: "Generation Failed", description: err.message || "Could not generate cover letter.", variant: "destructive" });
                      } finally {
                        setGeneratingCoverLetter(false);
                      }
                    }}
                    disabled={generatingCoverLetter}
                    className="gap-1.5"
                  >
                    {generatingCoverLetter ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                    {generatingCoverLetter ? "Generating..." : "Generate with AI"}
                  </Button>
                </div>
                <Textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Click 'Generate with AI' to create a tailored cover letter, or write your own..."
                  rows={5}
                  className="mt-1"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowApplyDialog(false)}>Cancel</Button>
                <Button onClick={handleApply} disabled={applying} className="gap-2">
                  {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit Application
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default JobSearch;
