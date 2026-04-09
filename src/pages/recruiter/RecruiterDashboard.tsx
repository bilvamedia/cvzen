import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, Search, PlusCircle, Calendar, Users, Briefcase, TrendingUp, Star, ExternalLink, Inbox, CreditCard, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Dashboard", href: "/recruiter", icon: LayoutDashboard },
  { label: "Post Job", href: "/recruiter/post-job", icon: PlusCircle },
  { label: "My Jobs", href: "/recruiter/jobs", icon: FileText },
  { label: "Applications", href: "/recruiter/applications", icon: Inbox },
  { label: "Search Candidates", href: "/recruiter/search", icon: Search },
  { label: "Interviews", href: "/recruiter/interviews", icon: Calendar },
  { label: "Billing", href: "/recruiter/billing", icon: CreditCard },
  { label: "Settings", href: "/recruiter/settings", icon: Settings },
];

const RecruiterDashboard = () => {
  const [stats, setStats] = useState({ activeJobs: 0, totalCandidates: 0, interviews: 0, shortlisted: 0 });
  const [recentShortlisted, setRecentShortlisted] = useState<any[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [jobsRes, shortlistRes, interviewsRes] = await Promise.all([
        supabase.from("jobs").select("id", { count: "exact" }).eq("recruiter_id", user.id).eq("status", "active"),
        supabase.from("shortlisted_candidates").select("id, candidate_profile_id, created_at", { count: "exact" }).eq("recruiter_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("interviews").select("*", { count: "exact" }).eq("recruiter_id", user.id).order("created_at", { ascending: false }).limit(3),
      ]);

      setStats({
        activeJobs: jobsRes.count || 0,
        totalCandidates: 0,
        interviews: interviewsRes.count || 0,
        shortlisted: shortlistRes.count || 0,
      });

      // Enrich shortlisted with profile names
      if (shortlistRes.data && shortlistRes.data.length > 0) {
        const ids = shortlistRes.data.map(s => s.candidate_profile_id);
        const { data: profiles } = await supabase.from("profiles").select("id, full_name, headline, profile_slug").in("id", ids);
        const pMap: Record<string, any> = {};
        profiles?.forEach(p => { pMap[p.id] = p; });
        setRecentShortlisted(shortlistRes.data.map(s => ({ ...s, profile: pMap[s.candidate_profile_id] })));
      }

      // Enrich interviews
      if (interviewsRes.data && interviewsRes.data.length > 0) {
        const cIds = [...new Set(interviewsRes.data.map(i => i.candidate_id))];
        const { data: cProfiles } = await supabase.from("profiles").select("id, full_name").in("id", cIds);
        const cMap: Record<string, string> = {};
        cProfiles?.forEach(p => { cMap[p.id] = p.full_name || "Unknown"; });
        setUpcomingInterviews(interviewsRes.data.map(i => ({ ...i, candidate_name: cMap[i.candidate_id] })));
      }
    };
    load();
  }, []);

  const statCards = [
    { label: "Active Jobs", value: stats.activeJobs, icon: Briefcase, color: "text-primary" },
    { label: "Shortlisted", value: stats.shortlisted, icon: Star, color: "text-yellow-500" },
    { label: "Interviews", value: stats.interviews, icon: Calendar, color: "text-green-500" },
  ];

  return (
    <DashboardLayout navItems={navItems} role="recruiter">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Recruiter Dashboard</h1>
        <p className="text-muted-foreground mb-6">Overview of your hiring activity.</p>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {statCards.map((s, i) => (
            <div key={i} className="bg-card rounded-xl p-5 shadow-card border border-border enterprise-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Link to="/recruiter/post-job" className="block">
            <div className="bg-card rounded-xl p-5 shadow-card border border-border enterprise-border hover-lift text-center">
              <PlusCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-semibold text-foreground text-sm">Post a Job</p>
              <p className="text-xs text-muted-foreground">AI-assisted listings</p>
            </div>
          </Link>
          <Link to="/recruiter/search" className="block">
            <div className="bg-card rounded-xl p-5 shadow-card border border-border enterprise-border hover-lift text-center">
              <Search className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-semibold text-foreground text-sm">Find Candidates</p>
              <p className="text-xs text-muted-foreground">Semantic search</p>
            </div>
          </Link>
          <Link to="/recruiter/interviews" className="block">
            <div className="bg-card rounded-xl p-5 shadow-card border border-border enterprise-border hover-lift text-center">
              <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-semibold text-foreground text-sm">Interviews</p>
              <p className="text-xs text-muted-foreground">Schedule & manage</p>
            </div>
          </Link>
        </div>

        {/* Recent shortlisted */}
        {recentShortlisted.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">Recently Shortlisted</h2>
            <div className="bg-card rounded-xl shadow-card border border-border divide-y divide-border">
              {recentShortlisted.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-medium text-foreground text-sm">{s.profile?.full_name || "Unknown"}</p>
                    {s.profile?.headline && <p className="text-xs text-muted-foreground">{s.profile.headline}</p>}
                  </div>
                  {s.profile?.profile_slug && (
                    <Link to={`/profile/${s.profile.profile_slug}`} target="_blank">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-3.5 w-3.5" /></Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming interviews */}
        {upcomingInterviews.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Recent Interviews</h2>
            <div className="bg-card rounded-xl shadow-card border border-border divide-y divide-border">
              {upcomingInterviews.map((i) => (
                <div key={i.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-medium text-foreground text-sm">{i.candidate_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.mode === "video" ? "Video" : i.mode === "phone" ? "Phone" : "In person"} · {i.duration_minutes}min ·{" "}
                      <span className={i.status === "confirmed" ? "text-green-600" : i.status === "cancelled" ? "text-red-500" : "text-yellow-600"}>
                        {i.status}
                      </span>
                    </p>
                  </div>
                  {i.confirmed_time && (
                    <p className="text-xs text-muted-foreground">{new Date(i.confirmed_time).toLocaleDateString()}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RecruiterDashboard;
