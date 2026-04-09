import { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Search, Sparkles, MapPin, Building2, Briefcase, ChevronDown, ChevronUp,
  Loader2, Send, Wand2, CheckCircle2, XCircle, Eye,
  DollarSign, Star, BadgeCheck, ExternalLink, Globe, Filter,
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { candidateNavItems as navItems } from "@/lib/navItems";

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

interface ExternalJob {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string;
  url: string;
  source: string;
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
  const [activeTab, setActiveTab] = useState<"platform" | "external">("platform");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [externalJobs, setExternalJobs] = useState<ExternalJob[]>([]);
  const [externalAnswer, setExternalAnswer] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchingExternal, setSearchingExternal] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchedExternal, setSearchedExternal] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());

  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterLocation, setFilterLocation] = useState("");

  // Candidate profile data for external search
  const [candidateSkills, setCandidateSkills] = useState<string[]>([]);
  const [candidateLocation, setCandidateLocation] = useState("");

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

  // Fetch candidate profile data and applied jobs on mount
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch applied jobs
      const { data: apps } = await supabase
        .from("job_applications")
        .select("job_id")
        .eq("candidate_id", user.id);
      if (apps) setAppliedJobs(new Set(apps.map((a) => a.job_id)));

      // Fetch profile for location
      const { data: profile } = await supabase
        .from("profiles")
        .select("address")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.address) setCandidateLocation(profile.address);

      // Fetch resume skills
      const { data: sections } = await supabase
        .from("resume_sections")
        .select("section_type, content, improved_content")
        .eq("user_id", user.id)
        .eq("section_type", "skills");
      if (sections && sections.length > 0) {
        const allSkills: string[] = [];
        sections.forEach((s) => {
          const items = (s.improved_content || s.content) as any;
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              if (typeof item === "string") allSkills.push(item);
              else if (item?.title) allSkills.push(item.title);
              else if (Array.isArray(item?.items)) allSkills.push(...item.items);
            });
          }
        });
        setCandidateSkills(allSkills.slice(0, 20));
      }
    };
    init();
  }, []);

  // Auto-search external jobs on mount if candidate has skills
  useEffect(() => {
    if (candidateSkills.length > 0 && !searchedExternal) {
      handleExternalSearch(candidateSkills.slice(0, 5).join(", "));
    }
  }, [candidateSkills]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);

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

    const queryTerms = query.toLowerCase().split(/\s+/);
    let scored = (data || []).map((job) => {
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
    let filtered = scored.filter((j) => j._score > 0).length > 0
      ? scored.filter((j) => j._score > 0)
      : scored.slice(0, 20);

    // Apply filters
    if (filterType !== "all") filtered = filtered.filter(j => j.employment_type === filterType);
    if (filterLevel !== "all") filtered = filtered.filter(j => j.experience_level === filterLevel);
    if (filterLocation.trim()) {
      const loc = filterLocation.toLowerCase();
      filtered = filtered.filter(j => j.location?.toLowerCase().includes(loc));
    }

    setJobs(filtered);
    setSearching(false);

    // Also trigger external search
    handleExternalSearch(query);
  };

  const handleExternalSearch = async (searchQuery: string) => {
    setSearchingExternal(true);
    setSearchedExternal(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-external-jobs", {
        body: {
          query: searchQuery,
          location: candidateLocation || filterLocation || undefined,
          skills: candidateSkills.length > 0 ? candidateSkills : undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setExternalJobs(data.jobs || []);
      setExternalAnswer(data.answer || null);
    } catch (err: any) {
      console.error("External search failed:", err);
      // Don't show error toast for external - graceful degradation
    } finally {
      setSearchingExternal(false);
    }
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
        } else throw error;
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
          Search platform jobs and external sources, optimize your CV, and apply.
        </p>

        {/* Search Bar */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="e.g. 'senior backend engineer' or 'product manager fintech'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={searching || searchingExternal} variant="hero">
            {searching ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Search
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Filters:
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="full_time">Full Time</SelectItem>
              <SelectItem value="part_time">Part Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="entry">Entry</SelectItem>
              <SelectItem value="mid">Mid Level</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Location filter..."
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="w-[160px] h-9 text-sm"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-6">
          <button
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "platform"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("platform")}
          >
            <Building2 className="h-4 w-4 inline mr-1.5 -mt-0.5" />
            Platform Jobs
            {searched && jobs.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{jobs.length}</Badge>
            )}
          </button>
          <button
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "external"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("external")}
          >
            <Globe className="h-4 w-4 inline mr-1.5 -mt-0.5" />
            External Jobs
            {searchedExternal && externalJobs.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{externalJobs.length}</Badge>
            )}
            {searchingExternal && <Loader2 className="h-3.5 w-3.5 inline ml-1.5 animate-spin" />}
          </button>
        </div>

        {/* Platform Jobs Tab */}
        {activeTab === "platform" && (
          <>
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
                <p className="text-muted-foreground">No matching jobs found. Try different keywords or check external jobs.</p>
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
                      <div className="p-4 sm:p-5 cursor-pointer" onClick={() => setExpandedJob(isExpanded ? null : job.id)}>
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
                              <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {job.company}</span>
                              {job.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>}
                              <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {employmentLabels[job.employment_type] || job.employment_type}</span>
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
                                {skills.length > 6 && <Badge variant="outline" className="text-xs">+{skills.length - 6}</Badge>}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!hasApplied && (
                              <Button size="sm" onClick={(e) => { e.stopPropagation(); handleOptimizeAndApply(job); }} className="gap-1 hidden sm:flex">
                                <Wand2 className="h-3.5 w-3.5" /> Optimize & Apply
                              </Button>
                            )}
                            {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                          </div>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t">
                          <div className="pt-4 space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Job Description</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{job.description}</p>
                            </div>
                            {job.experience_level && (
                              <div className="flex items-center gap-2 text-sm">
                                <Star className="h-4 w-4 text-primary" />
                                <span className="font-medium">Experience:</span>
                                <span className="text-muted-foreground capitalize">{job.experience_level.replace("_", " ")}</span>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">Posted {new Date(job.created_at).toLocaleDateString()}</p>
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
          </>
        )}

        {/* External Jobs Tab */}
        {activeTab === "external" && (
          <>
            {searchingExternal ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Searching across job boards based on your profile...</p>
              </div>
            ) : !searchedExternal ? (
              <div className="bg-card rounded-xl p-12 shadow-card border border-border text-center">
                <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Search to find jobs from LinkedIn, Indeed, Glassdoor, Naukri and more.</p>
              </div>
            ) : externalJobs.length === 0 ? (
              <div className="bg-card rounded-xl p-12 shadow-card border border-border text-center">
                <XCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No external jobs found. Try different keywords.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* AI Summary */}
                {externalAnswer && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm font-medium text-primary">AI Summary</span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{externalAnswer}</p>
                  </div>
                )}

                <p className="text-sm text-muted-foreground">{externalJobs.length} job{externalJobs.length !== 1 ? "s" : ""} from external sources</p>

                {externalJobs.map((job) => {
                  const isExpanded = expandedJob === job.id;
                  return (
                    <div key={job.id} className="border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      <div className="p-4 sm:p-5 cursor-pointer" onClick={() => setExpandedJob(isExpanded ? null : job.id)}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <h3 className="font-semibold text-base">{job.title}</h3>
                              <Badge variant="outline" className="text-xs gap-1">
                                <Globe className="h-3 w-3" /> {job.source}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {job.company}</span>
                              {job.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button size="sm" variant="outline" className="gap-1">
                                <ExternalLink className="h-3.5 w-3.5" /> View
                              </Button>
                            </a>
                            {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                          </div>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t">
                          <div className="pt-4 space-y-3">
                            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{job.description}</p>
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                            >
                              Apply on {job.source} <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
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
              {selectedJob && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold">{selectedJob.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedJob.company}{selectedJob.location ? ` • ${selectedJob.location}` : ""}</p>
                </div>
              )}

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

              <div className="flex gap-2">
                <Button size="sm" variant={viewMode === "optimized" ? "default" : "outline"} onClick={() => setViewMode("optimized")} className="gap-1">
                  <Wand2 className="h-3.5 w-3.5" /> Optimized CV
                </Button>
                <Button size="sm" variant={viewMode === "original" ? "default" : "outline"} onClick={() => setViewMode("original")} className="gap-1">
                  <Eye className="h-3.5 w-3.5" /> Original CV
                </Button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                {(viewMode === "optimized" ? optimizedSections : originalSections).map((section, idx) => (
                  <div key={idx} className="border-b last:border-0 pb-3 last:pb-0">
                    <h4 className="font-semibold text-sm flex items-center gap-2 mb-1.5">
                      {section.section_title}
                      {viewMode === "optimized" && <Badge className="bg-primary/10 text-primary text-[10px] border-0">AI Optimized</Badge>}
                    </h4>
                    {section.items.slice(0, 3).map((item: any, iIdx: number) => (
                      <div key={iIdx} className="ml-3 mb-1.5">
                        <p className="text-sm font-medium">{item.title}</p>
                        {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                        {item.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>}
                        {Array.isArray(item.details) && item.details.length > 0 && (
                          <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                            {item.details.slice(0, 2).map((d: string, dIdx: number) => (
                              <li key={dIdx} className="flex items-start gap-1">
                                <span className="text-primary mt-0.5">•</span>
                                <span className="line-clamp-1">{d}</span>
                              </li>
                            ))}
                            {item.details.length > 2 && <li className="text-muted-foreground/60">+{item.details.length - 2} more</li>}
                          </ul>
                        )}
                      </div>
                    ))}
                    {section.items.length > 3 && <p className="text-xs text-muted-foreground ml-3">+{section.items.length - 3} more items</p>}
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm font-medium">Cover Letter</Label>
                  <Button
                    size="sm" variant="outline"
                    onClick={async () => {
                      if (!selectedJob) return;
                      setGeneratingCoverLetter(true);
                      try {
                        const { data, error } = await supabase.functions.invoke("generate-cover-letter", { body: { jobId: selectedJob.id } });
                        if (error) throw error;
                        if (data?.error) throw new Error(data.error);
                        setCoverLetter(data.cover_letter || "");
                        toast({ title: "Cover Letter Generated", description: "AI has crafted a personalized cover letter." });
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
