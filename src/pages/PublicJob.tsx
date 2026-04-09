import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, MapPin, Briefcase, Clock, DollarSign, Globe, Building2,
  Share2, ArrowLeft, ExternalLink, Monitor, Home as HomeIcon, Wifi,
  Calendar, GraduationCap, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

const PublicJob = () => {
  const { slug } = useParams<{ slug: string }>();
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

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

  // SEO: Update document title and meta
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

  const handleApply = () => {
    if (user) {
      navigate(`/candidate/search?apply=${job?.id}`);
    } else {
      navigate(`/login?redirect=/jobs/${slug}`);
    }
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

  // JSON-LD structured data
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

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-gradient-to-r from-[hsl(220,30%,12%)] to-[hsl(215,35%,18%)] backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoHeader} alt="cvZen" className="h-7" />
          </Link>
          <div className="flex items-center gap-2">
            {!user && (
              <Link to="/signup">
                <Button size="sm" variant="hero" className="text-xs h-8">Sign Up</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">{job.title}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Main content */}
          <div className="space-y-6">
            {/* Job header card */}
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

              {/* Meta badges */}
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
                <Button variant="hero" className="w-full h-12 text-base font-semibold" onClick={handleApply}>
                  Apply Now
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
            {/* Apply card */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card sticky top-20">
              <h3 className="font-semibold text-foreground mb-1">Interested in this role?</h3>
              <p className="text-sm text-muted-foreground mb-4">Apply with your optimized CV and AI cover letter.</p>
              <Button variant="hero" className="w-full h-11 font-semibold mb-3" onClick={handleApply}>
                Apply Now
              </Button>
              {!user && (
                <p className="text-xs text-muted-foreground text-center">
                  You'll need to <Link to={`/login?redirect=/jobs/${slug}`} className="text-primary hover:underline">sign in</Link> to apply
                </p>
              )}

              <Separator className="my-4" />

              {/* Share */}
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

            {/* Company info */}
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
    </div>
  );
};

export default PublicJob;
