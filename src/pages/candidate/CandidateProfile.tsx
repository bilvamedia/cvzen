import { useEffect, useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, User, Search, Share2, Loader2, Target, Mail, Phone, MapPin, Globe, Linkedin, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ResumeSections from "@/components/ResumeSections";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { label: "Dashboard", href: "/candidate", icon: LayoutDashboard },
  { label: "My Resume", href: "/candidate/resume", icon: FileText },
  { label: "Digital Profile", href: "/candidate/profile", icon: User },
  { label: "ATS Score", href: "/candidate/ats-score", icon: Target },
  { label: "Search Jobs", href: "/candidate/search", icon: Search },
];

const CandidateProfile = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [improvingKey, setImprovingKey] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const profileRes = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (profileRes.data) setProfile(profileRes.data);

    const { data: latestResume } = await supabase
      .from("resumes")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "parsed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (latestResume) {
      const { data: secs } = await supabase
        .from("resume_sections")
        .select("*")
        .eq("resume_id", latestResume.id)
        .order("display_order", { ascending: true });
      if (secs) setSections(secs);
    }
    setLoading(false);
  };

  const handleImproveItem = async (sectionId: string, itemIndex: number) => {
    const key = `${sectionId}-${itemIndex}`;
    setImprovingKey(key);
    try {
      const { data, error } = await supabase.functions.invoke("improve-section", {
        body: { sectionId, itemIndex },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSections(prev => prev.map(s => 
        s.id === sectionId 
          ? { ...s, improved_content: data.improved_content }
          : s
      ));
      toast({ title: "Item improved!", description: "The enhanced version is now showing." });
    } catch (err: any) {
      toast({ title: "Improvement failed", description: err.message, variant: "destructive" });
    } finally {
      setImprovingKey(null);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/profile/${profile?.id}`);
    toast({ title: "Link copied!", description: "Share this link with recruiters." });
  };

  const buildResumeContent = () => {
    let text = "";
    if (profile?.full_name) text += `${profile.full_name}\n`;
    if (profile?.headline) text += `${profile.headline}\n`;
    const contactParts: string[] = [];
    if (profile?.email) contactParts.push(profile.email);
    if (profile?.phone) contactParts.push(profile.phone);
    if (profile?.address) contactParts.push(profile.address);
    if (profile?.linkedin_url) contactParts.push(profile.linkedin_url);
    if (profile?.website_url) contactParts.push(profile.website_url);
    if (contactParts.length) text += contactParts.join(" | ") + "\n";
    text += "\n";

    sections.forEach(section => {
      const displayContent = section.improved_content || section.content;
      const items = displayContent?.items || [];
      text += `${"=".repeat(40)}\n${section.section_title.toUpperCase()}\n${"=".repeat(40)}\n\n`;
      items.forEach((item: any) => {
        if (item.title) {
          text += `${item.title}`;
          if (item.subtitle) text += ` — ${item.subtitle}`;
          text += "\n";
        }
        if (item.date_range || item.location) {
          const parts = [item.date_range, item.location].filter(Boolean);
          text += `${parts.join(" | ")}\n`;
        }
        if (item.description) text += `${item.description}\n`;
        if (item.details?.length) {
          item.details.forEach((d: string) => { text += `  • ${d}\n`; });
        }
        if (item.tags?.length) text += `Skills: ${item.tags.join(", ")}\n`;
        text += "\n";
      });
    });
    return text;
  };

  const downloadAsText = (format: "pdf" | "docx") => {
    setDownloading(true);
    try {
      const content = buildResumeContent();
      // For both formats, we generate a clean text file the user can open
      // PDF generation via browser print
      if (format === "pdf") {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`
            <html><head><title>${profile?.full_name || "Resume"}</title>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.6; }
              h1 { font-size: 24px; margin-bottom: 4px; }
              .headline { color: #555; font-size: 14px; margin-bottom: 8px; }
              .contact { color: #666; font-size: 12px; margin-bottom: 24px; }
              .section-title { font-size: 16px; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #2563eb; padding-bottom: 4px; margin: 24px 0 12px; color: #1e40af; }
              .item { margin-bottom: 16px; }
              .item-title { font-weight: 600; font-size: 14px; }
              .item-subtitle { color: #555; font-size: 13px; }
              .item-meta { color: #888; font-size: 12px; margin-bottom: 4px; }
              .item-desc { font-size: 13px; color: #333; }
              ul { margin: 4px 0; padding-left: 20px; }
              li { font-size: 13px; color: #333; margin-bottom: 2px; }
              .tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
              .tag { background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
              @media print { body { margin: 0; } }
            </style></head><body>`);
          
          if (profile?.full_name) printWindow.document.write(`<h1>${profile.full_name}</h1>`);
          if (profile?.headline) printWindow.document.write(`<div class="headline">${profile.headline}</div>`);
          const contactParts: string[] = [];
          if (profile?.email) contactParts.push(profile.email);
          if (profile?.phone) contactParts.push(profile.phone);
          if (profile?.address) contactParts.push(profile.address);
          if (profile?.linkedin_url) contactParts.push(`<a href="${profile.linkedin_url}">LinkedIn</a>`);
          if (profile?.website_url) contactParts.push(`<a href="${profile.website_url}">Website</a>`);
          if (contactParts.length) printWindow.document.write(`<div class="contact">${contactParts.join(" &nbsp;|&nbsp; ")}</div>`);

          sections.forEach(section => {
            const displayContent = section.improved_content || section.content;
            const items = displayContent?.items || [];
            printWindow.document.write(`<div class="section-title">${section.section_title}</div>`);
            items.forEach((item: any) => {
              printWindow.document.write(`<div class="item">`);
              if (item.title) printWindow.document.write(`<div class="item-title">${item.title}${item.subtitle ? ` — <span class="item-subtitle">${item.subtitle}</span>` : ""}</div>`);
              const meta = [item.date_range, item.location].filter(Boolean).join(" | ");
              if (meta) printWindow.document.write(`<div class="item-meta">${meta}</div>`);
              if (item.description) printWindow.document.write(`<div class="item-desc">${item.description}</div>`);
              if (item.details?.length) {
                printWindow.document.write(`<ul>${item.details.map((d: string) => `<li>${d}</li>`).join("")}</ul>`);
              }
              if (item.tags?.length) {
                printWindow.document.write(`<div class="tags">${item.tags.map((t: string) => `<span class="tag">${t}</span>`).join("")}</div>`);
              }
              printWindow.document.write(`</div>`);
            });
          });

          printWindow.document.write(`</body></html>`);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => printWindow.print(), 500);
        }
      } else {
        // DOCX: generate as formatted plain text download
        const blob = new Blob([content], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(profile?.full_name || "Resume").replace(/\s+/g, "_")}_Resume.docx`;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast({ title: "Download started", description: `Your ${format.toUpperCase()} is being prepared.` });
    } catch (err: any) {
      toast({ title: "Download failed", description: err.message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} role="candidate">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} role="candidate">
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Digital Profile</h1>
            <p className="text-muted-foreground">Your AI-generated professional profile.</p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={downloading || sections.length === 0}>
                  <Download className="h-4 w-4 mr-1" /> Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => downloadAsText("pdf")}>
                  <FileText className="h-4 w-4 mr-2" /> Download as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadAsText("docx")}>
                  <FileText className="h-4 w-4 mr-2" /> Download as Word
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="hero" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" /> Share
            </Button>
          </div>
        </div>

        {/* Profile header card with personal info */}
        <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden mb-6">
          <div className="h-24 hero-gradient" />
          <div className="px-6 pb-6">
            <div className="h-16 w-16 rounded-full bg-secondary border-4 border-card -mt-8 flex items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mt-3">
              {profile?.full_name || "Your Name"}
            </h2>
            {profile?.headline && (
              <p className="text-sm text-primary font-medium mt-1">{profile.headline}</p>
            )}
            {profile?.bio && (
              <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>
            )}

            {/* Contact / Personal Information */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-sm text-muted-foreground">
              {profile?.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  <a href={`mailto:${profile.email}`} className="hover:text-primary">{profile.email}</a>
                </span>
              )}
              {profile?.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  <a href={`tel:${profile.phone}`} className="hover:text-primary">{profile.phone}</a>
                </span>
              )}
              {profile?.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {profile.address}
                </span>
              )}
              {profile?.linkedin_url && (
                <span className="flex items-center gap-1.5">
                  <Linkedin className="h-3.5 w-3.5 text-primary" />
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">LinkedIn</a>
                </span>
              )}
              {profile?.website_url && (
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">Website</a>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic sections with per-item improve */}
        {sections.length > 0 ? (
          <ResumeSections
            sections={sections}
            onImproveItem={handleImproveItem}
            improvingKey={improvingKey}
          />
        ) : (
          <div className="bg-card rounded-xl p-8 shadow-card border border-border text-center">
            <p className="text-muted-foreground text-sm">
              No sections yet. Upload and parse your resume to populate your profile.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CandidateProfile;
