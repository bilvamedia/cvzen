import { useEffect, useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, User, Search, Share2, Loader2, Target, Mail, Phone, MapPin, Globe, Linkedin, Download, Pencil, Camera, Plus, X, Check, Sparkles, Github, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ResumeSections from "@/components/ResumeSections";
import JobPreferences from "@/components/JobPreferences";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { candidateNavItems as navItems } from "@/lib/navItems";
import ProfileQRCode from "@/components/ProfileQRCode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const CandidateProfile = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [improvingKey, setImprovingKey] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Edit states
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingLinks, setEditingLinks] = useState(false);
  const [profileForm, setProfileForm] = useState<any>({});
  const [linksForm, setLinksForm] = useState<any[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);

  // Avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Add section
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionType, setNewSectionType] = useState("");
  const [newSectionItems, setNewSectionItems] = useState<any[]>([{ title: "", description: "", details: [] }]);
  const [addingSectionLoading, setAddingSectionLoading] = useState(false);
  const [improvingBio, setImprovingBio] = useState(false);

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

  // === Avatar Upload ===
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;

      await supabase.from("profiles").update({ avatar_url }).eq("id", user.id);
      setProfile((p: any) => ({ ...p, avatar_url }));
      toast({ title: "Avatar updated!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // === Edit Personal Info ===
  const openEditProfile = () => {
    setProfileForm({
      full_name: profile?.full_name || "",
      headline: profile?.headline || "",
      bio: profile?.bio || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
    });
    setEditingProfile(true);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("profiles").update(profileForm).eq("id", user.id);
      if (error) throw error;
      setProfile((p: any) => ({ ...p, ...profileForm }));
      setEditingProfile(false);
      toast({ title: "Profile updated!" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  // === Edit Social Links ===
  const openEditLinks = () => {
    // Migrate legacy fields into social_links array
    const existing: Array<{platform: string; url: string}> = Array.isArray(profile?.social_links) ? [...profile.social_links] : [];
    // Add legacy fields if not already in array
    if (profile?.linkedin_url && !existing.some((l: any) => l.url === profile.linkedin_url)) {
      existing.push({ platform: "LinkedIn", url: profile.linkedin_url });
    }
    if (profile?.website_url && !existing.some((l: any) => l.url === profile.website_url)) {
      existing.push({ platform: "Website", url: profile.website_url });
    }
    if (existing.length === 0) existing.push({ platform: "", url: "" });
    setLinksForm(existing);
    setEditingLinks(true);
  };

  const saveLinks = async () => {
    setSavingLinks(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const cleanLinks = (linksForm as any[]).filter((l: any) => l.url?.trim());
      // Also update legacy columns for backward compat
      const linkedinEntry = cleanLinks.find((l: any) => l.platform?.toLowerCase() === "linkedin");
      const websiteEntry = cleanLinks.find((l: any) => l.platform?.toLowerCase() === "website");
      const { error } = await supabase.from("profiles").update({
        social_links: cleanLinks,
        linkedin_url: linkedinEntry?.url || null,
        website_url: websiteEntry?.url || null,
      } as any).eq("id", user.id);
      if (error) throw error;
      setProfile((p: any) => ({ ...p, social_links: cleanLinks, linkedin_url: linkedinEntry?.url || null, website_url: websiteEntry?.url || null }));
      setEditingLinks(false);
      toast({ title: "Links updated!" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSavingLinks(false);
    }
  };

  // === Add Section ===
  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return;
    setAddingSectionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: latestResume } = await supabase
        .from("resumes")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "parsed")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (!latestResume) throw new Error("No parsed CV found. Upload a CV first.");

      const maxOrder = sections.reduce((max, s) => Math.max(max, s.display_order), 0);
      const cleanItems = newSectionItems.filter(i => i.title?.trim() || i.description?.trim());
      if (cleanItems.length === 0) throw new Error("Add at least one item with a title or description.");

      const { data, error } = await supabase.from("resume_sections").insert({
        resume_id: latestResume.id,
        user_id: user.id,
        section_title: newSectionTitle.trim(),
        section_type: newSectionType.trim() || newSectionTitle.trim().toLowerCase().replace(/\s+/g, "_"),
        content: { items: cleanItems },
        display_order: maxOrder + 1,
      }).select().single();
      if (error) throw error;
      setSections(prev => [...prev, data]);
      setAddSectionOpen(false);
      setNewSectionTitle("");
      setNewSectionType("");
      setNewSectionItems([{ title: "", description: "", details: [] }]);
      toast({ title: "Section added!" });
    } catch (err: any) {
      toast({ title: "Failed to add section", description: err.message, variant: "destructive" });
    } finally {
      setAddingSectionLoading(false);
    }
  };

  const updateNewItem = (idx: number, field: string, value: string) => {
    setNewSectionItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    ));
  };

  const addNewItem = () => {
    setNewSectionItems(prev => [...prev, { title: "", description: "", details: [] }]);
  };

  const removeNewItem = (idx: number) => {
    if (newSectionItems.length <= 1) return;
    setNewSectionItems(prev => prev.filter((_, i) => i !== idx));
  };

  // === Improve Item ===
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

  // === Improve Bio with AI ===
  const handleImproveBio = async () => {
    setImprovingBio(true);
    try {
      // Gather resume context
      const resumeContext = sections.map(s => {
        const content = s.improved_content || s.content;
        const items = content?.items || [];
        return `${s.section_title}:\n${items.map((it: any) => [it.title, it.subtitle, it.description, ...(it.details || [])].filter(Boolean).join(" — ")).join("\n")}`;
      }).join("\n\n");

      const currentBio = profileForm.bio || "";
      const name = profileForm.full_name || profile?.full_name || "";
      const headline = profileForm.headline || profile?.headline || "";

      const { data, error } = await supabase.functions.invoke("improve-section", {
        body: {
          customPrompt: true,
          prompt: `You are a professional CV writer. Based on the following CV data, ${currentBio ? "improve this bio" : "write a compelling professional bio"} for ${name || "this candidate"}${headline ? ` who is a ${headline}` : ""}. Keep it concise (2-4 sentences), professional, and highlight key strengths.\n\n${currentBio ? `Current bio: ${currentBio}\n\n` : ""}Resume data:\n${resumeContext}\n\nReturn ONLY the improved bio text, nothing else.`,
        },
      });
      if (error) throw error;
      if (data?.improved_text) {
        setProfileForm((p: any) => ({ ...p, bio: data.improved_text }));
        toast({ title: "Bio generated!", description: "Review and save when ready." });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ title: "Bio improvement failed", description: err.message, variant: "destructive" });
    } finally {
      setImprovingBio(false);
    }
  };

  const handleShare = () => {
    const slug = profile?.profile_slug || profile?.id;
    navigator.clipboard.writeText(`${window.location.origin}/profile/${slug}`);
    toast({ title: "Link copied!", description: `Share this link with recruiters: /profile/${slug}` });
  };

  // === Download ===
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
        const blob = new Blob([content], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(profile?.full_name || "CV").replace(/\s+/g, "_")}_CV.docx`;
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Digital Profile</h1>
            <p className="text-muted-foreground">Your AI-generated professional profile.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
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
            <ProfileQRCode profileSlug={profile?.profile_slug} fullName={profile?.full_name} avatarUrl={profile?.avatar_url} />
            <Button variant="hero" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" /> Share
            </Button>
          </div>
        </div>

        {/* Profile header card */}
        <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden mb-6">
          <div className="h-24 hero-gradient" />
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative w-fit -mt-8">
              <div className="h-16 w-16 rounded-full bg-secondary border-4 border-card flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
              >
                {uploadingAvatar ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            {/* Name / Headline / Bio */}
            <div className="flex items-start justify-between mt-3">
              <div>
                <h2 className="text-xl font-bold text-foreground">{profile?.full_name || "Your Name"}</h2>
                {profile?.headline && <p className="text-sm text-primary font-medium mt-1">{profile.headline}</p>}
                {profile?.bio && <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>}
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={openEditProfile}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Contact Info */}
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
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {(() => {
                const links: Array<{platform: string; url: string}> = Array.isArray(profile?.social_links) && profile.social_links.length > 0
                  ? profile.social_links
                  : [
                      ...(profile?.linkedin_url ? [{ platform: "LinkedIn", url: profile.linkedin_url }] : []),
                      ...(profile?.website_url ? [{ platform: "Website", url: profile.website_url }] : []),
                    ];
                return links.map((link: any, i: number) => {
                  const name = link.platform || "Link";
                  const IconComp = name.toLowerCase() === "linkedin" ? Linkedin
                    : name.toLowerCase() === "github" ? Github
                    : Globe;
                  return (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
                      <IconComp className="h-3.5 w-3.5 text-primary" /> {name}
                    </a>
                  );
                });
              })()}
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={openEditLinks}>
                <Pencil className="h-3 w-3 mr-1" /> Edit Links
              </Button>
            </div>
          </div>
        </div>

        {/* Job Preferences */}
        {profile?.id && (
          <JobPreferences editable userId={profile.id} />
        )}

        {/* Sections */}
        {sections.length > 0 ? (
          <ResumeSections
            sections={sections}
            onImproveItem={handleImproveItem}
            improvingKey={improvingKey}
          />
        ) : (
          <div className="bg-card rounded-xl p-8 shadow-card border border-border text-center">
            <p className="text-muted-foreground text-sm">
              No sections yet. Upload and parse your CV to populate your profile.
            </p>
          </div>
        )}

        {/* Add Section Button */}
        <div className="mt-4">
          <Button variant="outline" className="w-full border-dashed" onClick={() => setAddSectionOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Section
          </Button>
        </div>
      </div>

      {/* === Edit Personal Info Dialog === */}
      <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Personal Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={profileForm.full_name || ""} onChange={e => setProfileForm((p: any) => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div>
              <Label>Headline</Label>
              <Input value={profileForm.headline || ""} onChange={e => setProfileForm((p: any) => ({ ...p, headline: e.target.value }))} placeholder="e.g. Senior Software Engineer" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Bio</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={handleImproveBio}
                  disabled={improvingBio}
                >
                  {improvingBio ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {profileForm.bio ? "Improve with AI" : "Generate with AI"}
                </Button>
              </div>
              <Textarea value={profileForm.bio || ""} onChange={e => setProfileForm((p: any) => ({ ...p, bio: e.target.value }))} rows={3} placeholder="Write or generate a professional bio..." />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={profileForm.email || ""} onChange={e => setProfileForm((p: any) => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={profileForm.phone || ""} onChange={e => setProfileForm((p: any) => ({ ...p, phone: e.target.value }))} placeholder="+1 234 567 8900" />
            </div>
            <div>
              <Label>Address / Location</Label>
              <Input value={profileForm.address || ""} onChange={e => setProfileForm((p: any) => ({ ...p, address: e.target.value }))} placeholder="City, Country" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProfile(false)}>Cancel</Button>
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Edit Social Links Dialog === */}
      <Dialog open={editingLinks} onOpenChange={setEditingLinks}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Social Links</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(linksForm as any[]).map((link: any, idx: number) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Platform (e.g. LinkedIn, GitHub, Dribbble)"
                    value={link.platform || ""}
                    onChange={e => {
                      const updated = [...(linksForm as any[])];
                      updated[idx] = { ...updated[idx], platform: e.target.value };
                      setLinksForm(updated);
                    }}
                  />
                  <Input
                    placeholder="https://..."
                    value={link.url || ""}
                    onChange={e => {
                      const updated = [...(linksForm as any[])];
                      updated[idx] = { ...updated[idx], url: e.target.value };
                      setLinksForm(updated);
                    }}
                  />
                </div>
                {(linksForm as any[]).length > 1 && (
                  <button
                    onClick={() => setLinksForm((prev: any) => prev.filter((_: any, i: number) => i !== idx))}
                    className="mt-2 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed"
              onClick={() => setLinksForm((prev: any) => [...prev, { platform: "", url: "" }])}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Link
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLinks(false)}>Cancel</Button>
            <Button onClick={saveLinks} disabled={savingLinks}>
              {savingLinks ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Add Section Dialog === */}
      <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Section Title</Label>
              <Input value={newSectionTitle} onChange={e => setNewSectionTitle(e.target.value)} placeholder="e.g. Volunteering, Publications, Awards" />
            </div>
            <div>
              <Label>Section Type (optional)</Label>
              <Input value={newSectionType} onChange={e => setNewSectionType(e.target.value)} placeholder="e.g. volunteer, publications" />
            </div>
            <div className="space-y-3">
              <Label>Items</Label>
              {newSectionItems.map((item, idx) => (
                <div key={idx} className="border border-border rounded-lg p-3 space-y-2 relative">
                  {newSectionItems.length > 1 && (
                    <button onClick={() => removeNewItem(idx)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <Input placeholder="Title" value={item.title} onChange={e => updateNewItem(idx, "title", e.target.value)} />
                  <Input placeholder="Subtitle (optional)" value={item.subtitle || ""} onChange={e => updateNewItem(idx, "subtitle", e.target.value)} />
                  <Input placeholder="Date range (optional)" value={item.date_range || ""} onChange={e => updateNewItem(idx, "date_range", e.target.value)} />
                  <Textarea placeholder="Description" value={item.description} onChange={e => updateNewItem(idx, "description", e.target.value)} rows={2} />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addNewItem} className="w-full border-dashed">
                <Plus className="h-3 w-3 mr-1" /> Add Item
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSectionOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSection} disabled={addingSectionLoading || !newSectionTitle.trim()}>
              {addingSectionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Add Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CandidateProfile;
