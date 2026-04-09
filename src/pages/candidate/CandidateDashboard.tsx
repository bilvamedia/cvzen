import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, User, Search, Share2, Target, ThumbsUp, Bookmark, Eye, Calendar, CreditCard, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Dashboard", href: "/candidate", icon: LayoutDashboard },
  { label: "My CV", href: "/candidate/resume", icon: FileText },
  { label: "Digital Profile", href: "/candidate/profile", icon: User },
  { label: "ATS Score", href: "/candidate/ats-score", icon: Target },
  { label: "Search Jobs", href: "/candidate/search", icon: Search },
  { label: "Interviews", href: "/candidate/interviews", icon: Calendar },
  { label: "Billing", href: "/candidate/billing", icon: CreditCard },
  { label: "Settings", href: "/candidate/settings", icon: Settings },
];

const CandidateDashboard = () => {
  const [stats, setStats] = useState({ completeness: 0, sections: 0, atsScore: 0 });
  const [recruiterStats, setRecruiterStats] = useState({ likes: 0, shortlists: 0 });
  const [profileSlug, setProfileSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      const profileFields = ["full_name", "email", "phone", "headline", "bio", "address", "linkedin_url", "website_url", "avatar_url"];
      const filledFields = profile ? profileFields.filter((f) => profile[f as keyof typeof profile]) : [];
      const completeness = Math.round((filledFields.length / profileFields.length) * 100);
      setProfileSlug(profile?.profile_slug || null);

      const { count: sectionCount } = await supabase
        .from("resume_sections")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      const { data: latestScore } = await supabase
        .from("ats_score_history")
        .select("overall_score")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fetch recruiter activity on this profile
      const { count: likeCount } = await supabase
        .from("profile_likes")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", userId);

      const { data: shortlistData } = await supabase.rpc("get_candidate_shortlist_count", {
        _candidate_id: userId,
      });

      setStats({
        completeness,
        sections: sectionCount || 0,
        atsScore: latestScore?.overall_score || 0,
      });
      setRecruiterStats({
        likes: likeCount || 0,
        shortlists: shortlistData || 0,
      });
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchStats(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setLoading(true);
        fetchStats(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const statCards = [
    { label: "Profile Completeness", value: `${stats.completeness}%`, color: "text-primary", icon: User },
    { label: "CV Sections", value: String(stats.sections), color: "text-accent", icon: FileText },
    { label: "ATS Score", value: stats.atsScore ? `${stats.atsScore}/100` : "N/A", color: "text-foreground", icon: Target },
  ];

  const recruiterActivityCards = [
    { label: "Profile Upvotes", value: String(recruiterStats.likes), color: "text-primary", icon: ThumbsUp, description: "Visitors who upvoted your profile" },
    { label: "Shortlisted By", value: String(recruiterStats.shortlists), color: "text-accent", icon: Bookmark, description: "Recruiters who shortlisted you" },
  ];

  return (
    <DashboardLayout navItems={navItems} role="candidate">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back 👋</h1>
        <p className="text-muted-foreground mb-8">Here's your overview.</p>

        {/* Profile Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statCards.map((s, i) => (
            <div key={i} className="bg-card rounded-xl p-5 shadow-card border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <s.icon className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className={`text-3xl font-bold ${s.color}`}>
                {loading ? "…" : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Recruiter Activity */}
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Recruiter Activity
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {recruiterActivityCards.map((s, i) => (
            <div key={i} className="bg-card rounded-xl p-5 shadow-card border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <s.icon className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className={`text-3xl font-bold ${s.color}`}>
                {loading ? "…" : s.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Upload CV</h3>
                <p className="text-xs text-muted-foreground">Get AI-powered analysis</p>
              </div>
            </div>
            <Link to="/candidate/resume">
              <Button variant="hero" size="sm" className="w-full">Upload & Parse</Button>
            </Link>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Share2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Share Profile</h3>
                <p className="text-xs text-muted-foreground">Create your digital profile</p>
              </div>
            </div>
            <Link to="/candidate/profile">
              <Button variant="accent" size="sm" className="w-full">View Profile</Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CandidateDashboard;
