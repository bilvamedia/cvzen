import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, User, Search, Share2, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ResumeSections from "@/components/ResumeSections";

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

      // Update the local section with improved content
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
          <Button variant="hero" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1" /> Share
          </Button>
        </div>

        {/* Profile header card */}
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
            {profile?.email && (
              <p className="text-xs text-muted-foreground mt-1">{profile.email}</p>
            )}
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
