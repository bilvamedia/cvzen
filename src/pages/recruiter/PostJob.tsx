import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Sparkles, Loader2, X, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { recruiterNavItems as navItems } from "@/lib/navItems";

const PostJob = () => {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [workMode, setWorkMode] = useState("onsite");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setSkillInput("");
    }
  };

  const generateDescription = async () => {
    if (!title || !company) {
      toast({ title: "Missing info", description: "Please enter a job title and company first.", variant: "destructive" });
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-job-description", {
        body: { title, company, location, employmentType, experienceLevel, skills },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setDescription(data.description || "");
      toast({ title: "Description generated", description: "AI has drafted a job description. Review and edit as needed." });
    } catch (err: any) {
      toast({ title: "AI generation failed", description: err.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.from("jobs").insert({
        recruiter_id: user.id,
        title, company, location, description,
        employment_type: employmentType,
        experience_level: experienceLevel || null,
        salary_min: salaryMin ? parseInt(salaryMin) : null,
        salary_max: salaryMax ? parseInt(salaryMax) : null,
        salary_currency: "INR",
        skills,
        company_website: companyWebsite || null,
        work_mode: workMode,
        status: "active",
      } as any).select("job_slug").single();
      if (error) throw error;
      setPublishedSlug(data?.job_slug);
      toast({ title: "Job published!", description: "Your job listing is now live." });

      // Generate embedding for semantic search (fire-and-forget)
      if (data?.job_slug) {
        const { data: jobRow } = await supabase.from("jobs").select("id").eq("job_slug", data.job_slug).single();
        if (jobRow) {
          const { data: { session } } = await supabase.auth.getSession();
          supabase.functions.invoke("generate-embeddings", {
            body: { jobIds: [jobRow.id] },
          }).then(res => {
            if (res.error) console.warn("Job embedding generation failed:", res.error);
            else console.log("Job embedding generated");
          });
        }
      }
    } catch (err: any) {
      toast({ title: "Failed to post job", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const jobUrl = publishedSlug ? `${window.location.origin}/jobs/${publishedSlug}` : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(jobUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied!" });
  };

  if (publishedSlug) {
    return (
      <DashboardLayout navItems={navItems} role="recruiter">
        <div className="max-w-lg mx-auto text-center py-12">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Job Published!</h1>
          <p className="text-muted-foreground mb-6">Your job listing is live and ready to share.</p>

          <div className="bg-card border border-border rounded-xl p-5 mb-6 text-left">
            <Label className="text-xs text-muted-foreground mb-2 block">Public Job Link</Label>
            <div className="flex items-center gap-2">
              <Input value={jobUrl} readOnly className="enterprise-border text-sm" />
              <Button variant="outline" size="icon" onClick={copyLink}>
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
              <a href={jobUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon"><ExternalLink className="h-4 w-4" /></Button>
              </a>
            </div>

            <div className="mt-4">
              <Label className="text-xs text-muted-foreground mb-2 block">Share on</Label>
              <div className="flex gap-2">
                {[
                  { key: "linkedin", label: "LinkedIn", color: "bg-[#0A66C2]" },
                  { key: "twitter", label: "𝕏 Twitter", color: "bg-foreground" },
                  { key: "whatsapp", label: "WhatsApp", color: "bg-[#25D366]" },
                ].map((p) => (
                  <Button
                    key={p.key}
                    size="sm"
                    className={`${p.color} text-white hover:opacity-90 text-xs`}
                    onClick={() => {
                      const text = `We're hiring! ${title} at ${company}. Apply now:`;
                      const urls: Record<string, string> = {
                        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`,
                        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(jobUrl)}`,
                        whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + jobUrl)}`,
                      };
                      window.open(urls[p.key], "_blank", "noopener,noreferrer,width=600,height=400");
                    }}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => { setPublishedSlug(null); setTitle(""); setCompany(""); setDescription(""); setSkills([]); setCompanyWebsite(""); }}>
              Post Another Job
            </Button>
            <Button variant="hero" onClick={() => navigate("/recruiter/jobs")}>
              View My Jobs
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} role="recruiter">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Post a Job</h1>
        <p className="text-muted-foreground mb-6">Create a job listing with AI-assisted descriptions.</p>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl p-6 shadow-card border border-border">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Job Title *</Label>
              <Input placeholder="Senior Backend Engineer" value={title} onChange={(e) => setTitle(e.target.value)} required className="enterprise-border" />
            </div>
            <div className="space-y-2">
              <Label>Company *</Label>
              <Input placeholder="Acme Inc." value={company} onChange={(e) => setCompany(e.target.value)} required className="enterprise-border" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Website</Label>
              <Input placeholder="https://acme.com" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className="enterprise-border" />
            </div>
            <div className="space-y-2">
              <Label>Work Mode</Label>
              <Select value={workMode} onValueChange={setWorkMode}>
                <SelectTrigger className="enterprise-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="onsite">In-Office</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder="San Francisco, CA" value={location} onChange={(e) => setLocation(e.target.value)} className="enterprise-border" />
            </div>
            <div className="space-y-2">
              <Label>Employment Type</Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger className="enterprise-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Experience Level</Label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger className="enterprise-border"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Level</SelectItem>
                  <SelectItem value="mid">Mid Level</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="lead">Lead / Staff</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Salary Min</Label>
              <Input type="number" placeholder="80000" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} className="enterprise-border" />
            </div>
            <div className="space-y-2">
              <Label>Salary Max</Label>
              <Input type="number" placeholder="120000" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} className="enterprise-border" />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label>Skills</Label>
            <div className="flex gap-2">
              <Input placeholder="e.g. React, Python" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} className="enterprise-border" />
              <Button type="button" variant="outline" size="sm" onClick={addSkill}>Add</Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {skills.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1 pr-1">
                    {s}
                    <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Description with AI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Job Description *</Label>
              <Button type="button" variant="outline" size="sm" onClick={generateDescription} disabled={aiLoading} className="gap-1.5 text-xs">
                {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}
                {aiLoading ? "Generating..." : "Generate with AI"}
              </Button>
            </div>
            <Textarea
              placeholder="Describe the role, responsibilities, requirements..."
              value={description} onChange={(e) => setDescription(e.target.value)}
              rows={12} required className="enterprise-border"
            />
          </div>

          <Button type="submit" variant="hero" className="w-full h-11" disabled={loading}>
            {loading ? "Publishing..." : "Publish Job"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default PostJob;
