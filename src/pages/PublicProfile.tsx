import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Globe, Linkedin, ExternalLink, Briefcase, ArrowLeft, Download, FileText, ThumbsUp, Bookmark, BookmarkCheck, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stripMarkdown } from "@/lib/stripMarkdown";
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

  // Auth & shortlist state
  const [currentUser, setCurrentUser] = useState<any>(null);
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

  // Check shortlist status when profile + user are ready
  useEffect(() => {
    if (profile && currentUser && isRecruiter) {
      checkShortlistStatus();
    }
  }, [profile, currentUser, isRecruiter]);

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
      <div className="bg-gradient-to-br from-primary to-accent text-white">
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="inline-flex items-center text-white/70 hover:text-white text-sm transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to CVZen
            </Link>

            {/* Recruiter logged-in indicator */}
            {currentUser && isRecruiter && (
              <span className="text-xs text-white/60 hidden sm:inline">
                Signed in as <span className="text-white/90 font-medium">{currentUser.email}</span>
              </span>
            )}
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

              {/* Action buttons row */}
              <div className="flex flex-wrap items-center gap-2 mt-6">
                {/* Like button */}
                <button
                  onClick={handleLike}
                  disabled={hasLiked || liking}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    hasLiked
                      ? "bg-white/20 text-white cursor-default"
                      : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/20 hover:border-white/30"
                  }`}
                >
                  <ThumbsUp className={`h-4 w-4 transition-transform duration-300 ${hasLiked ? "fill-current scale-110" : ""}`} />
                  <span>{likeCount}</span>
                </button>

                {/* Shortlist button */}
                <button
                  onClick={handleShortlist}
                  disabled={shortlisting}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    isShortlisted
                      ? "bg-green-500/20 text-green-100 border border-green-400/30"
                      : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/20 hover:border-white/30"
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

                {/* Download CV */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/20 hover:border-white/30 transition-all duration-300">
                      <Download className="h-4 w-4" /> Download CV
                    </button>
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

      {/* Auth Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-primary" />
              Recruiter Sign In
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Sign in or create a recruiter account to shortlist this candidate.
          </p>
          <Tabs value={authTab} onValueChange={setAuthTab} className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleAuthSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    required
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    placeholder="you@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    required
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                {authError && <p className="text-sm text-destructive">{authError}</p>}
                <Button type="submit" className="w-full" disabled={authLoading}>
                  {authLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleAuthSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    required
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    placeholder="Jane Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Work Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    placeholder="you@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    minLength={6}
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                </div>
                {authError && <p className="text-sm text-destructive">{authError}</p>}
                <Button type="submit" className="w-full" disabled={authLoading}>
                  {authLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Recruiter Account
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  By signing up you agree to our <Link to="/terms" className="underline">Terms</Link> & <Link to="/privacy" className="underline">Privacy Policy</Link>.
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
