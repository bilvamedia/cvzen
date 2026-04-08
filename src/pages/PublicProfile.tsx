import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Globe, Linkedin, ExternalLink, MapPin, Briefcase, ArrowLeft, Download, FileText, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { stripMarkdown } from "@/lib/stripMarkdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PublicProfileData {
  id: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  address: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  email: string | null;
  phone: string | null;
  social_links: any;
  profile_slug: string | null;
}

const PublicProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) loadPublicProfile(slug);
  }, [slug]);

  const loadPublicProfile = async (profileSlug: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, headline, bio, avatar_url, address, linkedin_url, website_url, email, phone, social_links, profile_slug")
        .eq("profile_slug", profileSlug)
        .single();

      if (error || !data) {
        setNotFound(true);
        return;
      }

      setProfile(data as PublicProfileData);

      const { data: secs } = await supabase.rpc("get_public_resume_sections", {
        _profile_id: data.id,
      });
      if (secs && Array.isArray(secs)) setSections(secs);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const buildCVContent = () => {
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
    if (profile?.bio) text += `ABOUT\n${profile.bio}\n\n`;

    sections.forEach(section => {
      const displayContent = section.improved_content || section.content;
      const items = displayContent?.items || [];
      text += `${"=".repeat(40)}\n${section.section_title.toUpperCase()}\n${"=".repeat(40)}\n\n`;
      items.forEach((item: any) => {
        if (item.title) {
          text += `${stripMarkdown(item.title)}`;
          if (item.subtitle) text += ` — ${stripMarkdown(item.subtitle)}`;
          text += "\n";
        }
        if (item.date_range || item.location) {
          text += `${[item.date_range, item.location].filter(Boolean).join(" | ")}\n`;
        }
        if (item.description) text += `${stripMarkdown(item.description)}\n`;
        if (item.details?.length) {
          item.details.forEach((d: string) => { text += `  • ${stripMarkdown(d)}\n`; });
        }
        if (item.tags?.length) text += `Skills: ${item.tags.join(", ")}\n`;
        text += "\n";
      });
    });
    return text;
  };

  const downloadCV = (format: "pdf" | "docx") => {
    if (format === "pdf") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document.write(`
        <html><head><title>${profile?.full_name || "CV"}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.6; }
          h1 { font-size: 24px; margin-bottom: 4px; }
          .headline { color: #555; font-size: 14px; margin-bottom: 8px; }
          .contact { color: #666; font-size: 12px; margin-bottom: 16px; }
          .bio { font-size: 13px; color: #333; margin-bottom: 24px; border-left: 3px solid #2563eb; padding-left: 12px; }
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
      if (profile?.bio) printWindow.document.write(`<div class="bio">${profile.bio}</div>`);

      sections.forEach(section => {
        const displayContent = section.improved_content || section.content;
        const items = displayContent?.items || [];
        printWindow.document.write(`<div class="section-title">${section.section_title}</div>`);
        items.forEach((item: any) => {
          printWindow.document.write(`<div class="item">`);
          if (item.title) printWindow.document.write(`<div class="item-title">${stripMarkdown(item.title)}${item.subtitle ? ` — <span class="item-subtitle">${stripMarkdown(item.subtitle)}</span>` : ""}</div>`);
          const meta = [item.date_range, item.location].filter(Boolean).join(" | ");
          if (meta) printWindow.document.write(`<div class="item-meta">${meta}</div>`);
          if (item.description) printWindow.document.write(`<div class="item-desc">${stripMarkdown(item.description)}</div>`);
          if (item.details?.length) {
            printWindow.document.write(`<ul>${item.details.map((d: string) => `<li>${stripMarkdown(d)}</li>`).join("")}</ul>`);
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
    } else {
      const content = buildCVContent();
      const blob = new Blob([content], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(profile?.full_name || "CV").replace(/\s+/g, "_")}_CV.docx`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-2xl font-bold text-foreground">Profile Not Found</h1>
        <p className="text-muted-foreground">This profile doesn't exist or hasn't been set up yet.</p>
        <Link to="/">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Button>
        </Link>
      </div>
    );
  }

  const socialLinks = Array.isArray(profile.social_links) ? profile.social_links : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--cvzen-navy))] text-white">
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="inline-flex items-center text-white/70 hover:text-white text-sm transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to CVZen
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 border border-white/20">
                  <Download className="h-4 w-4 mr-1.5" /> Download CV
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => downloadCV("pdf")}>
                  <FileText className="h-4 w-4 mr-2" /> Download as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadCV("docx")}>
                  <FileText className="h-4 w-4 mr-2" /> Download as Word
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-col md:flex-row items-start gap-6">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || "Profile"}
                className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-white/20 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white/10 flex items-center justify-center text-3xl font-bold border-4 border-white/20">
                {profile.full_name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {profile.full_name || "Unnamed Candidate"}
              </h1>
              {profile.headline && (
                <p className="text-lg text-white/80 mt-2">{profile.headline}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-white/60">
                {profile.email && (
                  <a href={`mailto:${profile.email}`} className="flex items-center gap-1 hover:text-white transition-colors">
                    <Mail className="w-4 h-4" />{profile.email}
                  </a>
                )}
                {profile.phone && (
                  <a href={`tel:${profile.phone}`} className="flex items-center gap-1 hover:text-white transition-colors">
                    <Phone className="w-4 h-4" />{profile.phone}
                  </a>
                )}
                {profile.address && (
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{profile.address}</span>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                    <Linkedin className="w-4 h-4" />LinkedIn
                  </a>
                )}
                {profile.website_url && (
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                    <Globe className="w-4 h-4" />Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Bio */}
        {profile.bio && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" /> About
            </h2>
            <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">Links</h2>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((link: any, i: number) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer">
                  <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-accent transition-colors py-1.5 px-3">
                    <ExternalLink className="w-3 h-3" />
                    {link.platform || "Link"}
                  </Badge>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* CV Sections */}
        {sections.length > 0 && (
          <>
            <Separator className="my-8" />
            {sections.map((section) => {
              const displayContent = section.improved_content || section.content;
              const items = displayContent?.items || [];
              return (
                <div key={section.id} className="mb-8">
                  <h2 className="text-lg font-semibold text-foreground mb-4 uppercase tracking-wide border-b-2 border-primary pb-2">
                    {section.section_title}
                  </h2>
                  <div className="space-y-4">
                    {items.map((item: any, idx: number) => (
                      <div key={idx} className="group">
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                          <div>
                            {item.title && (
                              <h3 className="font-semibold text-foreground">
                                {stripMarkdown(item.title)}
                                {item.subtitle && <span className="font-normal text-muted-foreground"> — {stripMarkdown(item.subtitle)}</span>}
                              </h3>
                            )}
                          </div>
                          {(item.date_range || item.location) && (
                            <span className="text-sm text-muted-foreground mt-0.5 sm:mt-0">
                              {[item.date_range, item.location].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </div>
                         {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">{stripMarkdown(item.description)}</p>
                        )}
                        {item.details?.length > 0 && (
                          <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1 ml-1">
                            {item.details.map((d: string, di: number) => (
                              <li key={di}>{stripMarkdown(d)}</li>
                            ))}
                          </ul>
                        )}
                        {item.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.tags.map((tag: string, ti: number) => (
                              <Badge key={ti} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {sections.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>This candidate hasn't added any CV sections yet.</p>
          </div>
        )}

        {/* Footer */}
        <Separator className="my-8" />
        <div className="text-center text-sm text-muted-foreground py-4">
          Powered by <Link to="/" className="text-primary hover:underline font-medium">CVZen.ai</Link>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
