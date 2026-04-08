import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, User, Search, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ResumeSections from "@/components/ResumeSections";

const navItems = [
  { label: "Dashboard", href: "/candidate", icon: LayoutDashboard },
  { label: "My Resume", href: "/candidate/resume", icon: FileText },
  { label: "Digital Profile", href: "/candidate/profile", icon: User },
  { label: "Search Jobs", href: "/candidate/search", icon: Search },
];

const CandidateProfile = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, sectionsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("resume_sections").select("*").eq("user_id", user.id).order("display_order", { ascending: true }),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (sectionsRes.data) setSections(sectionsRes.data);
    setLoading(false);
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

        {/* Dynamic sections */}
        {sections.length > 0 ? (
          <ResumeSections sections={sections} />
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
