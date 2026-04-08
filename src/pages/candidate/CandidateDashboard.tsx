import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, User, Search, Share2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Dashboard", href: "/candidate", icon: LayoutDashboard },
  { label: "My Resume", href: "/candidate/resume", icon: FileText },
  { label: "Digital Profile", href: "/candidate/profile", icon: User },
  { label: "ATS Score", href: "/candidate/ats-score", icon: Target },
  { label: "Search Jobs", href: "/candidate/search", icon: Search },
];

const CandidateDashboard = () => {
  const [stats, setStats] = useState({ completeness: 0, sections: 0, atsScore: 0 });
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

      setStats({
        completeness,
        sections: sectionCount || 0,
        atsScore: latestScore?.overall_score || 0,
      });
      setLoading(false);
    };

    // Wait for auth session to be ready before querying
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
    { label: "Profile Completeness", value: `${stats.completeness}%`, color: "text-primary" },
    { label: "Resume Sections", value: String(stats.sections), color: "text-accent" },
    { label: "ATS Score", value: stats.atsScore ? `${stats.atsScore}/100` : "N/A", color: "text-foreground" },
  ];

  return (
    <DashboardLayout navItems={navItems} role="candidate">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back 👋</h1>
        <p className="text-muted-foreground mb-8">Here's your overview.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statCards.map((s, i) => (
            <div key={i} className="bg-card rounded-xl p-5 shadow-card border border-border">
              <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>
                {loading ? "…" : s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Upload Resume</h3>
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
