import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, MapPin, Briefcase, Clock, DollarSign, Globe, Building2,
  Share2, ArrowLeft, ExternalLink, Monitor, Home as HomeIcon, Wifi,
  Calendar, GraduationCap, Copy, Check, Eye, EyeOff, ArrowRight,
  Wand2, Send, BadgeCheck, XCircle, Upload, FileText, CheckCircle2,
  Shield, Zap, Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import logoHeader from "@/assets/logo-header.svg";

interface JobData {
  id: string;
  title: string;
  company: string;
  company_website: string | null;
  work_mode: string;
  description: string;
  location: string | null;
  employment_type: string;
  experience_level: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  skills: string[] | null;
  created_at: string;
  job_slug: string;
}

interface OptimizedSection {
  section_title: string;
  section_type: string;
  items: any[];
}

const WORK_MODE_LABELS: Record<string, { label: string; icon: typeof Monitor }> = {
  onsite: { label: "In-Office", icon: Building2 },
  remote: { label: "Remote", icon: Wifi },
  hybrid: { label: "Hybrid", icon: Monitor },
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  entry: "Entry Level",
  mid: "Mid Level",
  senior: "Senior",
  lead: "Lead / Staff",
  executive: "Executive",
};

type ApplyStep = "idle" | "auth" | "optimize" | "applied";

const PublicJob = () => {
  const { slug } = useParams<{ slug: string }>();
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Auth modal state
  const [applyStep, setApplyStep] = useState<ApplyStep>("idle");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Optimize & Apply state
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedSections, setOptimizedSections] = useState<OptimizedSection[]>([]);
  const [originalSections, setOriginalSections] = useState<OptimizedSection[]>([]);
  const [matchScore, setMatchScore] = useState(0);
  const [optimizationSummary, setOptimizationSummary] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  const [applying, setApplying] = useState(false);
  const [viewMode, setViewMode] = useState<"optimized" | "original">("optimized");
  const [hasResume, setHasResume] = useState(false);
  const [checkingResume, setCheckingResume] = useState(false);
  const [hasAlreadyApplied, setHasAlreadyApplied] = useState(false);

  // Fetch user + role
  const refreshUser = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    if (u) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
      setUserRole(roles?.[0]?.role || null);
    } else {
      setUserRole(null);
    }
    return u;
  }, []);

  useEffect(() => {
    refreshUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshUser();
    });
    return () => subscription.unsubscribe();
  }, [refreshUser]);

  useEffect(() => {
    if (!slug) return;
    const fetchJob = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_public_job_by_slug", { _slug: slug });
      if (!error && data && data.length > 0) {
        setJob(data[0] as unknown as JobData);
      }
      setLoading(false);
    };
    fetchJob();
  }, [slug]);

  // Check if candidate already applied
  useEffect(() => {
    if (!user || !job || userRole !== "candidate") return;
    supabase
      .from("job_applications")
      .select("id")
      .eq("candidate_id", user.id)
      .eq("job_id", job.id)
      .maybeSingle()
      .then(({ data }) => {
        setHasAlreadyApplied(!!data);
      });
  }, [user, job, userRole]);

  // SEO
  useEffect(() => {
    if (!job) return;
    document.title = `${job.title} at ${job.company} — cvZen Jobs`;
    const metaDesc = document.querySelector('meta[name="description"]');
    const desc = `${job.title} at ${job.company}${job.location ? ` in ${job.location}` : ""}. ${EMPLOYMENT_LABELS[job.employment_type] || job.employment_type}. Apply now on cvZen.`;
    if (metaDesc) metaDesc.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
    return () => { document.title = "cvZen — Intelligent Hiring OS"; };
  }, [job]);

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = async (platform: string) => {
    const text = `${job?.title} at ${job?.company} — Apply now!`;
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(pageUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + pageUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
    };
    if (platform === "copy") {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied!" });
      return;
    }
    window.open(urls[platform], "_blank", "noopener,noreferrer,width=600,height=400");
  };

  // ── Apply Flow ──
  const handleApplyClick = async () => {
    if (hasAlreadyApplied) {
      toast({ title: "Already Applied", description: "You've already applied to this job." });
      return;
    }

    // If recruiter, block
    if (user && userRole === "recruiter") {
      toast({
        title: "Recruiters can't apply",
        description: "Only candidates can apply for jobs. Please sign in with a candidate account.",
        variant: "destructive",
      });
      return;
    }

    // If logged in as candidate, go to optimize step
    if (user && userRole === "candidate") {
      await startOptimization();
      return;
    }

    // Not logged in → show auth modal
    setApplyStep("auth");
    setAuthMode("login");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMode === "signup") {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: { full_name: authName },
            emailRedirectTo: window.location.href,
          },
        });
        if (signUpError) throw signUpError;

        const newUser = signUpData.user;
        if (!newUser) throw new Error("Signup failed. Please try again.");

        // Create profile + role
        await supabase.from("profiles").insert({
          id: newUser.id,
          full_name: authName,
          email: authEmail,
          role: "candidate" as any,
        });
        await supabase.from("user_roles").insert({
          user_id: newUser.id,
          role: "candidate" as any,
        });

        setUser(newUser);
        setUserRole("candidate");

        // Check if they need to upload a resume first
        const { data: resumes } = await supabase
          .from("resumes")
          .select("id")
          .eq("user_id", newUser.id)
          .eq("status", "parsed");

        if (!resumes || resumes.length === 0) {
          toast({
            title: "Welcome! Upload your CV first",
            description: "You need to upload and parse your CV before applying. Redirecting to CV upload...",
          });
          setApplyStep("idle");
          setTimeout(() => navigate(`/candidate/resume?redirect=/jobs/${slug}`), 1500);
          return;
        }

        await startOptimization(newUser.id);
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (loginError) throw loginError;

        const { data: { user: loggedInUser } } = await supabase.auth.getUser();
        if (!loggedInUser) throw new Error("Login failed.");

        // Check role
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", loggedInUser.id);
        const role = roles?.[0]?.role;

        if (role === "recruiter") {
          toast({
            title: "Recruiter account detected",
            description: "Only candidates can apply for jobs. Please use a candidate account.",
            variant: "destructive",
          });
          setAuthLoading(false);
          return;
        }

        setUser(loggedInUser);
        setUserRole(role || null);

        // Check resume
        const { data: resumes } = await supabase
          .from("resumes")
          .select("id")
          .eq("user_id", loggedInUser.id)
          .eq("status", "parsed");

        if (!resumes || resumes.length === 0) {
          toast({
            title: "Upload your CV first",
            description: "You need a parsed CV to apply. Redirecting to CV upload...",
          });
          setApplyStep("idle");
          setTimeout(() => navigate(`/candidate/resume?redirect=/jobs/${slug}`), 1500);
          return;
        }

        await startOptimization(loggedInUser.id);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAuthLoading(false);
    }
  };

  const startOptimization = async (userId?: string) => {
    if (!job) return;
    const uid = userId || user?.id;
    if (!uid) return;

    // Check resume exists
    setCheckingResume(true);
    const { data: resumes } = await supabase
      .from("resumes")
      .select("id")
      .eq("user_id", uid)
      .eq("status", "parsed");

    if (!resumes || resumes.length === 0) {
      setCheckingResume(false);
      toast({
        title: "Upload your CV first",
        description: "You need a parsed CV to apply. Redirecting to CV upload...",
      });
      setApplyStep("idle");
      setTimeout(() => navigate(`/candidate/resume?redirect=/jobs/${slug}`), 1500);
      return;
    }

    setHasResume(true);
    setCheckingResume(false);
    setApplyStep("optimize");
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
        description: err.message || "Could not optimize resume.",
        variant: "destructive",
      });
      setApplyStep("idle");
    } finally {
      setOptimizing(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!job || !user) return;
    setApplying(true);
    try {
      const { error } = await supabase.from("job_applications").insert({
        candidate_id: user.id,
        job_id: job.id,
        cover_letter: coverLetter || null,
        optimized_resume_snapshot: optimizedSections as any,
        match_score: matchScore,
        status: "applied",
      } as any);

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already Applied", description: "You've already applied to this job." });
        } else throw error;
      } else {
        setHasAlreadyApplied(true);
        setApplyStep("applied");
        toast({ title: "Application Submitted! 🎉", description: `Your optimized CV has been sent to ${job.company}.` });
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

  const formatSalary = (min: number | null, max: number | null, currency: string | null) => {
    const c = currency || "USD";
    const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    if (max) return `Up to ${fmt(max)}`;
    return null;
  };

  const timeAgo = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days} days ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Job not found</h1>
        <p className="text-muted-foreground">This listing may have been removed or is no longer active.</p>
        <Link to="/"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Back to Home</Button></Link>
      </div>
    );
  }

  const workMode = WORK_MODE_LABELS[job.work_mode] || WORK_MODE_LABELS.onsite;
  const WorkIcon = workMode.icon;
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
  const skills = Array.isArray(job.skills) ? job.skills : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.created_at,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      ...(job.company_website ? { sameAs: job.company_website } : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: job.location || "Remote",
    },
    employmentType: job.employment_type?.toUpperCase().replace("_", ""),
    ...(job.salary_min || job.salary_max ? {
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: job.salary_currency || "USD",
        value: {
          "@type": "QuantitativeValue",
          ...(job.salary_min ? { minValue: job.salary_min } : {}),
          ...(job.salary_max ? { maxValue: job.salary_max } : {}),
          unitText: "YEAR",
        },
      },
    } : {}),
  };

  const applyButtonLabel = hasAlreadyApplied
    ? "Already Applied"
    : user && userRole === "recruiter"
    ? "Candidates Only"
    : "Apply Now";

  const applyButtonDisabled = hasAlreadyApplied || (user && userRole === "recruiter");

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-gradient-to-r from-[hsl(220,30%,12%)] to-[hsl(215,35%,18%)] backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoHeader} alt="cvZen" className="h-7" />
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <Button size="sm" variant="ghost" className="text-xs h-8 text-white/70 hover:text-white" onClick={() => navigate(userRole === "recruiter" ? "/recruiter" : "/candidate")}>
                Dashboard
              </Button>
            ) : (
              <Link to="/signup">
                <Button size="sm" variant="hero" className="text-xs h-8">Sign Up</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">{job.title}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Main content */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 sm:p-8 shadow-card">
              <div className="flex flex-wrap items-start gap-4 mb-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-1">{job.title}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg text-muted-foreground font-medium">{job.company}</span>
                    {job.company_website && (
                      <a href={job.company_website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
                        <Globe className="h-3.5 w-3.5" /> Website
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {job.location && (
                  <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-sm font-normal">
                    <MapPin className="h-3.5 w-3.5" /> {job.location}
                  </Badge>
                )}
                <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-sm font-normal">
                  <WorkIcon className="h-3.5 w-3.5" /> {workMode.label}
                </Badge>
                <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-sm font-normal">
                  <Briefcase className="h-3.5 w-3.5" /> {EMPLOYMENT_LABELS[job.employment_type] || job.employment_type}
                </Badge>
                {job.experience_level && (
                  <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-sm font-normal">
                    <GraduationCap className="h-3.5 w-3.5" /> {EXPERIENCE_LABELS[job.experience_level] || job.experience_level}
                  </Badge>
                )}
                {salary && (
                  <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-sm font-normal">
                    <DollarSign className="h-3.5 w-3.5" /> {salary}
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1.5 py-1 px-3 text-sm font-normal text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" /> Posted {timeAgo(job.created_at)}
                </Badge>
              </div>

              {/* Mobile apply */}
              <div className="lg:hidden">
                <Button
                  variant="hero"
                  className="w-full h-12 text-base font-semibold"
                  onClick={handleApplyClick}
                  disabled={!!applyButtonDisabled}
                >
                  {hasAlreadyApplied && <CheckCircle2 className="h-5 w-5 mr-2" />}
                  {applyButtonLabel}
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="bg-card rounded-xl border border-border p-6 sm:p-8 shadow-card">
              <h2 className="text-lg font-semibold text-foreground mb-4">Job Description</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {job.description}
              </div>
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-6 sm:p-8 shadow-card">
                <h2 className="text-lg font-semibold text-foreground mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="py-1.5 px-4 text-sm">
                      {String(skill)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 hidden lg:block">
            <div className="bg-card rounded-xl border border-border p-6 shadow-card sticky top-20">
              <h3 className="font-semibold text-foreground mb-1">Interested in this role?</h3>
              <p className="text-sm text-muted-foreground mb-4">Apply with your optimized CV and AI cover letter.</p>
              <Button
                variant="hero"
                className="w-full h-11 font-semibold mb-3"
                onClick={handleApplyClick}
                disabled={!!applyButtonDisabled}
              >
                {hasAlreadyApplied && <CheckCircle2 className="h-5 w-5 mr-2" />}
                {applyButtonLabel}
              </Button>
              {!user && !hasAlreadyApplied && (
                <p className="text-xs text-muted-foreground text-center">
                  Sign in as a candidate to apply
                </p>
              )}
              {user && userRole === "recruiter" && (
                <p className="text-xs text-destructive text-center">
                  Switch to a candidate account to apply
                </p>
              )}

              <Separator className="my-4" />

              <h4 className="text-sm font-medium text-foreground mb-3">Share this job</h4>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { key: "linkedin", label: "in", color: "bg-[#0A66C2]" },
                  { key: "twitter", label: "𝕏", color: "bg-foreground" },
                  { key: "whatsapp", label: "W", color: "bg-[#25D366]" },
                  { key: "facebook", label: "f", color: "bg-[#1877F2]" },
                  { key: "copy", label: copied ? "✓" : "🔗", color: "bg-muted" },
                ].map((p) => (
                  <button
                    key={p.key}
                    onClick={() => handleShare(p.key)}
                    className={`${p.key === "copy" ? "bg-muted text-foreground" : `${p.color} text-white`} rounded-lg h-10 flex items-center justify-center text-sm font-bold hover:opacity-90 transition-opacity`}
                    title={p.key === "copy" ? "Copy link" : `Share on ${p.key}`}
                  >
                    {p.key === "copy" ? (copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />) : p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h4 className="font-semibold text-foreground mb-3">About {job.company}</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>{job.company}</span>
                </div>
                {job.company_website && (
                  <a href={job.company_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                    <Globe className="h-4 w-4" />
                    <span className="truncate">{job.company_website.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                )}
                <div className="flex items-center gap-2">
                  <WorkIcon className="h-4 w-4 text-primary" />
                  <span>{workMode.label}</span>
                </div>
                {job.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{job.location}</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-gradient-to-r from-[hsl(220,30%,12%)] to-[hsl(215,35%,18%)] mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoHeader} alt="cvZen" className="h-6" />
            <span className="text-xs text-white/50">Intelligent Hiring OS</span>
          </div>
          <div className="flex gap-4 text-xs text-white/40">
            <Link to="/privacy" className="hover:text-white/70 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white/70 transition-colors">Terms</Link>
            <Link to="/pricing" className="hover:text-white/70 transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>

      {/* ── Auth Modal ── */}
      <Dialog open={applyStep === "auth"} onOpenChange={(open) => !authLoading && !open && setApplyStep("idle")}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={logoHeader} alt="cvZen" className="h-6" />
              <span className="text-xs font-normal tracking-widest uppercase" style={{ color: 'hsl(208 30% 70%)' }}>
                Intelligent Hiring OS
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="pt-2">
            <h3 className="text-lg font-semibold mb-1">
              {authMode === "login" ? "Sign in to apply" : "Create candidate account"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {authMode === "login"
                ? "Sign in with your candidate account to apply for this role."
                : "Create a free candidate account to apply with an AI-optimized CV."}
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === "signup" && (
                <div>
                  <Label htmlFor="auth-name">Full Name</Label>
                  <Input
                    id="auth-name"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
              )}
              <div>
                <Label htmlFor="auth-email">Email</Label>
                <Input
                  id="auth-email"
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="auth-pass">Password</Label>
                <div className="relative">
                  <Input
                    id="auth-pass"
                    type={showPassword ? "text" : "password"}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={authLoading}>
                {authLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                {authMode === "login" ? "Sign In & Apply" : "Sign Up & Apply"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              {authMode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button onClick={() => setAuthMode("signup")} className="text-primary hover:underline font-medium">
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button onClick={() => setAuthMode("login")} className="text-primary hover:underline font-medium">
                    Sign in
                  </button>
                </>
              )}
            </div>

            {authMode === "login" && (
              <div className="mt-2 text-center">
                <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
                  Forgot password?
                </Link>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Optimize & Apply Dialog ── */}
      <Dialog open={applyStep === "optimize"} onOpenChange={(open) => !optimizing && !applying && !open && setApplyStep("idle")}>
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
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold">{job.title}</h3>
                <p className="text-sm text-muted-foreground">{job.company}{job.location ? ` • ${job.location}` : ""}</p>
              </div>

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
                      if (!job) return;
                      setGeneratingCoverLetter(true);
                      try {
                        const { data, error } = await supabase.functions.invoke("generate-cover-letter", { body: { jobId: job.id } });
                        if (error) throw error;
                        if (data?.error) throw new Error(data.error);
                        setCoverLetter(data.cover_letter || "");
                        toast({ title: "Cover Letter Generated", description: "AI has crafted a personalized cover letter." });
                      } catch (err: any) {
                        toast({ title: "Generation Failed", description: err.message, variant: "destructive" });
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
                <Button variant="outline" onClick={() => setApplyStep("idle")}>Cancel</Button>
                <Button onClick={handleSubmitApplication} disabled={applying} className="gap-2">
                  {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit Application
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Applied Success Dialog ── */}
      <Dialog open={applyStep === "applied"} onOpenChange={() => setApplyStep("idle")}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="py-6 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Application Submitted!</h2>
            <p className="text-sm text-muted-foreground">
              Your AI-optimized CV and cover letter have been sent to <strong>{job.company}</strong> for the <strong>{job.title}</strong> role.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Button variant="outline" onClick={() => setApplyStep("idle")}>
                Close
              </Button>
              <Button onClick={() => navigate("/candidate")} className="gap-2">
                <ArrowRight className="h-4 w-4" /> Go to Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicJob;
