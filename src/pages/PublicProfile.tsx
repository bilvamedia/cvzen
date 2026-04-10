import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Globe, Linkedin, ExternalLink, Briefcase, ArrowLeft, Download, FileText, ThumbsUp, Bookmark, BookmarkCheck, X, LogIn, Mail, Phone, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import logoHeader from "@/assets/logo-header.svg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stripMarkdown } from "@/lib/stripMarkdown";
const CVChatAgent = lazy(() => import("@/components/CVChatAgent"));
import JobPreferences from "@/components/JobPreferences";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface PublicProfileData {
  id: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  social_links: any;
  profile_slug: string | null;
}

const getVisitorHash = async (): Promise<string> => {
  const stored = localStorage.getItem("cvzen_visitor_id");
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem("cvzen_visitor_id", id);
  return id;
};

const PublicProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [bioExpanded, setBioExpanded] = useState(false);
  const [prefsExpanded, setPrefsExpanded] = useState(false);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Auth & shortlist state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [contactInfo, setContactInfo] = useState<{ email: string | null; phone: string | null; address: string | null } | null>(null);
  const [isRecruiter, setIsRecruiter] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [shortlisting, setShortlisting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<string>("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Check auth state on mount
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      if (user) {
        // Check if recruiter
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "recruiter")
          .maybeSingle();
        setIsRecruiter(!!roleData);
        setShowAuthModal(false);
      } else {
        setIsRecruiter(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      if (user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "recruiter")
          .maybeSingle();
        setIsRecruiter(!!roleData);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check shortlist status and fetch contact info when profile + recruiter ready
  useEffect(() => {
    if (profile && currentUser && isRecruiter) {
      checkShortlistStatus();
      fetchContactInfo();
    }
  }, [profile, currentUser, isRecruiter]);

  const fetchContactInfo = async () => {
    if (!profile) return;
    const { data } = await supabase.rpc("get_profile_contact_for_recruiter", {
      _profile_id: profile.id,
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (row) setContactInfo(row);
  };

  const checkShortlistStatus = async () => {
    if (!profile || !currentUser) return;
    const { data } = await supabase
      .from("shortlisted_candidates")
      .select("id")
      .eq("recruiter_id", currentUser.id)
      .eq("candidate_profile_id", profile.id)
      .maybeSingle();
    setIsShortlisted(!!data);
  };

  const handleShortlist = async () => {
    if (!profile) return;

    // If not logged in, show auth modal
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    // If logged in but not recruiter
    if (!isRecruiter) {
      toast({
        title: "Recruiter access only",
        description: "Only recruiters can shortlist candidates. Please sign up as a recruiter.",
        variant: "destructive",
      });
      return;
    }

    setShortlisting(true);
    try {
      if (isShortlisted) {
        await supabase
          .from("shortlisted_candidates")
          .delete()
          .eq("recruiter_id", currentUser.id)
          .eq("candidate_profile_id", profile.id);
        setIsShortlisted(false);
        toast({ title: "Removed from shortlist" });
      } else {
        const { error } = await supabase
          .from("shortlisted_candidates")
          .insert({
            recruiter_id: currentUser.id,
            candidate_profile_id: profile.id,
          });
        if (!error) {
          setIsShortlisted(true);
          toast({ title: "Candidate shortlisted!" });
        }
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setShortlisting(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      if (authTab === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: { full_name: authName },
            emailRedirectTo: window.location.href,
          },
        });
        if (error) throw error;

        // Assign recruiter role
        if (data.user) {
          await supabase.from("user_roles").insert({
            user_id: data.user.id,
            role: "recruiter" as const,
          });
          // Create profile
          await supabase.from("profiles").insert({
            id: data.user.id,
            full_name: authName,
            email: authEmail,
            role: "recruiter" as const,
          });
        }

        toast({
          title: "Account created!",
          description: "Please verify your email to complete signup.",
        });
        setShowAuthModal(false);
        setAuthLoading(false);
        return;
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (slug) loadPublicProfile(slug);
  }, [slug]);

  const loadLikes = useCallback(async (profileId: string) => {
    const [countRes, visitorHash] = await Promise.all([
      supabase.from("profile_likes").select("id", { count: "exact", head: true }).eq("profile_id", profileId),
      getVisitorHash(),
    ]);
    setLikeCount(countRes.count || 0);

    const { data: existing } = await supabase
      .from("profile_likes")
      .select("id")
      .eq("profile_id", profileId)
      .eq("visitor_hash", visitorHash)
      .maybeSingle();
    setHasLiked(!!existing);
  }, []);

  const handleLike = async () => {
    if (!profile || hasLiked || liking) return;
    setLiking(true);
    try {
      const visitorHash = await getVisitorHash();
      const { error } = await supabase.from("profile_likes").insert({
        profile_id: profile.id,
        visitor_hash: visitorHash,
      });
      if (!error) {
        setHasLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch {
      // silently fail
    } finally {
      setLiking(false);
    }
  };

  const loadPublicProfile = async (profileSlug: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc("get_public_profile_by_slug", { _slug: profileSlug });

      const profileData = Array.isArray(data) ? data[0] : data;
      if (error || !profileData) {
        setNotFound(true);
        return;
      }

      setProfile(profileData as PublicProfileData);
      loadLikes(profileData.id);

      const { data: secs } = await supabase.rpc("get_public_resume_sections", {
        _profile_id: profileData.id,
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
      <div className="min-h-screen flex items-center justify-center profile-dark">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(203_80%_48%)]" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center profile-dark gap-4">
        <h1 className="text-2xl font-bold text-[hsl(220_20%_92%)]">Profile Not Found</h1>
        <p className="text-[hsl(220_10%_55%)]">This profile doesn't exist or hasn't been set up yet.</p>
        <Link to="/">
          <Button variant="outline" className="border-[hsl(240_10%_20%)] text-[hsl(220_20%_92%)] hover:bg-[hsl(240_15%_12%)]">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  const socialLinks = Array.isArray(profile.social_links) ? profile.social_links : [];

  return (
    <div className="min-h-screen profile-dark relative overflow-x-hidden">
      {/* Particle Background */}
      <div className="profile-particle-bg" />

      {/* Sticky top bar */}
      <header className="sticky top-0 z-30 profile-glass border-b border-[hsl(240_10%_16%/0.6)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-[hsl(220_10%_55%)] hover:text-[hsl(220_20%_92%)] text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <img src={logoHeader} alt="CVZen" className="h-6 brightness-200" />
          </Link>
          <div className="flex items-center gap-2">
            {currentUser && isRecruiter && (
              <span className="text-[10px] text-[hsl(220_10%_55%)] hidden sm:inline">
                {currentUser.email}
              </span>
            )}
            {/* Download CV */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[hsl(220_20%_92%)] bg-[hsl(240_15%_12%)] hover:bg-[hsl(240_12%_16%)] border border-[hsl(240_10%_20%)] transition-all">
                  <Download className="h-3.5 w-3.5" /> CV
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[hsl(240_15%_10%)] border-[hsl(240_10%_18%)] text-[hsl(220_20%_92%)]">
                <DropdownMenuItem onClick={() => downloadCV("pdf")} className="hover:bg-[hsl(240_12%_16%)] focus:bg-[hsl(240_12%_16%)]">
                  <FileText className="h-4 w-4 mr-2" /> PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadCV("docx")} className="hover:bg-[hsl(240_12%_16%)] focus:bg-[hsl(240_12%_16%)]">
                  <FileText className="h-4 w-4 mr-2" /> Word
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-12 pb-8 sm:pt-16 sm:pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
          {/* Glowing Avatar */}
          <div className="profile-glow-ring w-28 h-28 sm:w-36 sm:h-36 rounded-full mb-6">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || "Profile"}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[hsl(240_15%_12%)] flex items-center justify-center text-4xl sm:text-5xl font-bold text-[hsl(203_80%_48%)]">
                {profile.full_name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight profile-gradient-text mb-2">
            {profile.full_name || "Unnamed Candidate"}
          </h1>

          {/* Headline */}
          {profile.headline && (
            <p className="text-base sm:text-lg text-[hsl(220_10%_55%)] max-w-xl mt-1 leading-relaxed">
              {profile.headline}
            </p>
          )}

          {/* Social Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[hsl(220_10%_55%)] bg-[hsl(240_15%_8%/0.6)] border border-[hsl(240_10%_16%)] hover:text-[hsl(203_80%_48%)] hover:border-[hsl(203_80%_48%/0.4)] transition-all">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </a>
            )}
            {profile.website_url && (
              <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[hsl(220_10%_55%)] bg-[hsl(240_15%_8%/0.6)] border border-[hsl(240_10%_16%)] hover:text-[hsl(203_80%_48%)] hover:border-[hsl(203_80%_48%/0.4)] transition-all">
                <Globe className="w-3.5 h-3.5" /> Website
              </a>
            )}
            {socialLinks.map((link: any, i: number) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[hsl(220_10%_55%)] bg-[hsl(240_15%_8%/0.6)] border border-[hsl(240_10%_16%)] hover:text-[hsl(203_80%_48%)] hover:border-[hsl(203_80%_48%/0.4)] transition-all">
                <ExternalLink className="w-3.5 h-3.5" /> {link.platform || "Link"}
              </a>
            ))}
          </div>

          {/* Contact info - recruiter only */}
          {contactInfo && isRecruiter && (
            <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-xs text-[hsl(203_80%_48%)]">
              {contactInfo.email && (
                <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-1 hover:underline">
                  <Mail className="w-3 h-3" />{contactInfo.email}
                </a>
              )}
              {contactInfo.phone && (
                <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-1 hover:underline">
                  <Phone className="w-3 h-3" />{contactInfo.phone}
                </a>
              )}
              {contactInfo.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{contactInfo.address}
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-7">
            {/* Like */}
            <button
              onClick={handleLike}
              disabled={hasLiked || liking}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                hasLiked
                  ? "bg-[hsl(203_80%_48%/0.15)] text-[hsl(203_80%_55%)] border border-[hsl(203_80%_48%/0.3)]"
                  : "bg-[hsl(240_15%_12%)] text-[hsl(220_10%_55%)] hover:text-[hsl(203_80%_55%)] border border-[hsl(240_10%_20%)] hover:border-[hsl(203_80%_48%/0.3)] hover:shadow-[0_0_20px_hsl(203_80%_48%/0.15)]"
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${hasLiked ? "fill-current" : ""}`} />
              <span>{likeCount}</span>
            </button>

            {/* Shortlist */}
            <button
              onClick={handleShortlist}
              disabled={shortlisting}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                isShortlisted
                  ? "bg-[hsl(140_50%_30%/0.2)] text-[hsl(140_60%_65%)] border border-[hsl(140_50%_40%/0.3)]"
                  : "bg-[hsl(240_15%_12%)] text-[hsl(220_10%_55%)] hover:text-[hsl(220_20%_92%)] border border-[hsl(240_10%_20%)] hover:border-[hsl(240_10%_25%)]"
              }`}
            >
              {shortlisting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isShortlisted ? (
                <BookmarkCheck className="h-4 w-4 fill-current" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
              <span>{isShortlisted ? "Shortlisted" : "Shortlist"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        {/* Bio - collapsible */}
        {profile.bio && (
          <div className="profile-section-enter profile-glass rounded-2xl p-6 sm:p-8 mb-6">
            <button
              onClick={() => setBioExpanded(!bioExpanded)}
              className="w-full flex items-center justify-between mb-3"
            >
              <h2 className="text-sm font-semibold uppercase tracking-widest text-[hsl(203_80%_48%)] flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> About
              </h2>
              <ChevronDown className={`w-4 h-4 text-[hsl(220_10%_45%)] transition-transform duration-300 ${bioExpanded ? "rotate-180" : ""}`} />
            </button>
            <div className="relative">
              <p className={`text-[hsl(220_10%_65%)] leading-relaxed text-sm sm:text-base ${!bioExpanded ? "line-clamp-3" : ""}`}>
                {profile.bio}
              </p>
              {!bioExpanded && profile.bio.length > 200 && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[hsl(240_15%_6%)] to-transparent" />
              )}
            </div>
          </div>
        )}

        {/* Job Preferences - collapsible */}
        <div className="profile-section-enter mb-6" style={{ animationDelay: '0.1s' }}>
          <div className="profile-glass rounded-2xl overflow-hidden">
            <button
              onClick={() => setPrefsExpanded(!prefsExpanded)}
              className="w-full px-6 py-4 flex items-center justify-between"
            >
              <h2 className="text-sm font-semibold uppercase tracking-widest text-[hsl(220_20%_92%)] flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[hsl(203_80%_48%/0.12)] flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-[hsl(203_80%_48%)]" />
                </div>
                Job Preferences
              </h2>
              <ChevronDown className={`w-4 h-4 text-[hsl(220_10%_45%)] transition-transform duration-300 ${prefsExpanded ? "rotate-180" : ""}`} />
            </button>
            <div className={`transition-all duration-300 overflow-hidden ${prefsExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="px-6 pb-6">
                <JobPreferences profileId={profile.id} />
              </div>
            </div>
          </div>
        </div>

        {/* CV Sections - Timeline layout */}
        {sections.length > 0 && (
          <div className="space-y-6">
            {sections.map((section, sIdx) => {
              const displayContent = section.improved_content || section.content;
              const items = displayContent?.items || [];
              return (
                <div
                  key={section.id}
                  className="profile-section-enter profile-glass rounded-2xl overflow-hidden"
                  style={{ animationDelay: `${0.15 + sIdx * 0.08}s` }}
                >
                  {/* Section Header */}
                  <div className="px-6 py-4 border-b border-[hsl(240_10%_16%/0.6)] flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[hsl(203_80%_48%/0.12)] flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-[hsl(203_80%_48%)]" />
                    </div>
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-[hsl(220_20%_92%)]">
                      {section.section_title}
                    </h2>
                    <span className="ml-auto text-[10px] text-[hsl(220_10%_45%)] font-medium">
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Timeline Items */}
                  <div className="px-6 py-4">
                    <div className="ml-7 border-l-2 border-[hsl(203_80%_48%/0.15)] space-y-6">
                      {items.map((item: any, idx: number) => (
                        <div key={idx} className="profile-timeline-dot pl-6 relative">
                          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
                            <div>
                              {item.title && (
                                <h3 className="font-semibold text-[hsl(220_20%_92%)] text-sm sm:text-base">
                                  {stripMarkdown(item.title)}
                                  {item.subtitle && (
                                    <span className="font-normal text-[hsl(220_10%_55%)]"> — {stripMarkdown(item.subtitle)}</span>
                                  )}
                                </h3>
                              )}
                            </div>
                            {(item.date_range || item.location) && (
                              <span className="text-[11px] text-[hsl(220_10%_45%)] shrink-0">
                                {[item.date_range, item.location].filter(Boolean).join(" · ")}
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p className="text-sm text-[hsl(220_10%_55%)] mt-1 leading-relaxed">{stripMarkdown(item.description)}</p>
                          )}

                          {item.details?.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {item.details.map((d: string, di: number) => (
                                <li key={di} className="text-sm text-[hsl(220_10%_55%)] flex gap-2">
                                  <span className="text-[hsl(203_80%_48%)] mt-0.5 shrink-0">▸</span>
                                  <span>{stripMarkdown(d)}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {item.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {item.tags.map((tag: string, ti: number) => (
                                <span
                                  key={ti}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-[hsl(203_80%_48%/0.1)] text-[hsl(203_80%_60%)] border border-[hsl(203_80%_48%/0.15)] font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {sections.length === 0 && (
          <div className="text-center py-16 text-[hsl(220_10%_45%)]">
            <p>This candidate hasn't added any CV sections yet.</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-[hsl(220_10%_35%)] py-6 border-t border-[hsl(240_10%_12%)]">
          Powered by <Link to="/" className="text-[hsl(203_80%_48%)] hover:underline font-medium">CVZen.ai</Link>
        </div>
      </div>

      {/* AI Chat Agent */}
      <Suspense fallback={null}>
        <CVChatAgent
          profileId={profile.id}
          candidateName={profile.full_name || "Candidate"}
          avatarUrl={profile.avatar_url}
        />
      </Suspense>

      {/* Auth Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md bg-[hsl(240_15%_8%)] border-[hsl(240_10%_16%)] text-[hsl(220_20%_92%)]">
          <div className="flex flex-col items-center pt-2 pb-1">
            <img src={logoHeader} alt="cvZen" className="h-10 brightness-200" />
            <p className="text-[10px] font-medium mt-1.5 tracking-[0.25em] uppercase text-[hsl(220_10%_45%)]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Intelligent Hiring OS
            </p>
          </div>
          <p className="text-sm text-[hsl(220_10%_55%)] text-center">
            Sign in or create a recruiter account to shortlist this candidate.
          </p>
          <Tabs value={authTab} onValueChange={setAuthTab} className="mt-2">
            <TabsList className="grid w-full grid-cols-2 bg-[hsl(240_15%_12%)]">
              <TabsTrigger value="signin" className="data-[state=active]:bg-[hsl(203_80%_48%/0.15)] data-[state=active]:text-[hsl(203_80%_55%)]">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-[hsl(203_80%_48%/0.15)] data-[state=active]:text-[hsl(203_80%_55%)]">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleAuthSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-[hsl(220_10%_55%)]">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    required
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="bg-[hsl(240_15%_10%)] border-[hsl(240_10%_18%)] text-[hsl(220_20%_92%)] placeholder:text-[hsl(220_10%_35%)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-[hsl(220_10%_55%)]">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    required
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-[hsl(240_15%_10%)] border-[hsl(240_10%_18%)] text-[hsl(220_20%_92%)] placeholder:text-[hsl(220_10%_35%)]"
                  />
                </div>
                {authError && <p className="text-sm text-red-400">{authError}</p>}
                <Button type="submit" className="w-full bg-[hsl(203_80%_48%)] hover:bg-[hsl(203_80%_42%)] text-white" disabled={authLoading}>
                  {authLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleAuthSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-[hsl(220_10%_55%)]">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    required
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    placeholder="Jane Smith"
                    className="bg-[hsl(240_15%_10%)] border-[hsl(240_10%_18%)] text-[hsl(220_20%_92%)] placeholder:text-[hsl(220_10%_35%)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-[hsl(220_10%_55%)]">Work Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="bg-[hsl(240_15%_10%)] border-[hsl(240_10%_18%)] text-[hsl(220_20%_92%)] placeholder:text-[hsl(220_10%_35%)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-[hsl(220_10%_55%)]">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    minLength={6}
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="bg-[hsl(240_15%_10%)] border-[hsl(240_10%_18%)] text-[hsl(220_20%_92%)] placeholder:text-[hsl(220_10%_35%)]"
                  />
                </div>
                {authError && <p className="text-sm text-red-400">{authError}</p>}
                <Button type="submit" className="w-full bg-[hsl(203_80%_48%)] hover:bg-[hsl(203_80%_42%)] text-white" disabled={authLoading}>
                  {authLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Recruiter Account
                </Button>
                <p className="text-xs text-[hsl(220_10%_40%)] text-center">
                  By signing up you agree to our <Link to="/terms" className="underline text-[hsl(203_80%_48%)]">Terms</Link> & <Link to="/privacy" className="underline text-[hsl(203_80%_48%)]">Privacy Policy</Link>.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicProfile;
