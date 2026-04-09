import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, Search, PlusCircle, Calendar, Inbox, User, Briefcase, ChevronDown, ChevronUp, ExternalLink, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { recruiterNavItems as navItems } from "@/lib/navItems";

interface Application {
  id: string;
  candidate_id: string;
  job_id: string;
  status: string;
  match_score: number | null;
  cover_letter: string | null;
  optimized_resume_snapshot: any;
  created_at: string;
  candidate_name?: string;
  candidate_headline?: string;
  candidate_slug?: string;
  job_title?: string;
}

const statusColors: Record<string, string> = {
  applied: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  reviewed: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  shortlisted: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const Applications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState<Application | null>(null);
  const { toast } = useToast();

  const fetchApplications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, title")
      .eq("recruiter_id", user.id);
    if (!jobs || jobs.length === 0) { setLoading(false); return; }

    const jobIds = jobs.map(j => j.id);
    const jobMap: Record<string, string> = {};
    jobs.forEach(j => { jobMap[j.id] = j.title; });

    const { data: apps } = await supabase
      .from("job_applications")
      .select("*")
      .in("job_id", jobIds)
      .order("created_at", { ascending: false });

    if (!apps || apps.length === 0) { setLoading(false); return; }

    const candidateIds = [...new Set(apps.map(a => a.candidate_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, headline, profile_slug")
      .in("id", candidateIds);

    const pMap: Record<string, any> = {};
    profiles?.forEach(p => { pMap[p.id] = p; });

    setApplications(apps.map(a => ({
      ...a,
      candidate_name: pMap[a.candidate_id]?.full_name || "Unknown",
      candidate_headline: pMap[a.candidate_id]?.headline || "",
      candidate_slug: pMap[a.candidate_id]?.profile_slug,
      job_title: jobMap[a.job_id],
    })));
    setLoading(false);
  };

  useEffect(() => { fetchApplications(); }, []);

  const updateStatus = async (appId: string, newStatus: string) => {
    const { error } = await supabase
      .from("job_applications")
      .update({ status: newStatus })
      .eq("id", appId);
    if (error) {
      toast({ title: "Error updating status", variant: "destructive" });
      return;
    }
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    toast({ title: `Application ${newStatus}` });
  };

  const grouped: Record<string, Application[]> = {};
  applications.forEach(a => {
    if (!grouped[a.job_id]) grouped[a.job_id] = [];
    grouped[a.job_id].push(a);
  });

  return (
    <DashboardLayout navItems={navItems} role="recruiter">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Applications</h1>
        <p className="text-muted-foreground mb-6">Review candidates who applied to your jobs.</p>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="bg-card rounded-xl p-12 shadow-card border border-border text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No applications received yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([jobId, apps]) => {
              const isExpanded = expandedJob === jobId || expandedJob === null;
              return (
                <div key={jobId} className="bg-card rounded-xl shadow-card border border-border enterprise-border overflow-hidden">
                  <button
                    onClick={() => setExpandedJob(expandedJob === jobId ? null : jobId)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{apps[0].job_title}</h3>
                        <p className="text-xs text-muted-foreground">{apps.length} application{apps.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>

                  {isExpanded && (
                    <div className="divide-y divide-border">
                      {apps.map(app => (
                        <div key={app.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">{app.candidate_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{app.candidate_headline}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {app.match_score != null && (
                              <Badge variant="outline" className="text-[10px]">{Math.round(app.match_score)}% match</Badge>
                            )}
                            <Badge className={`text-[10px] ${statusColors[app.status] || ""}`}>{app.status}</Badge>
                            <p className="text-[10px] text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {app.candidate_slug ? (
                              <Link to={`/profile/${app.candidate_slug}`} target="_blank">
                                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                                  <FileText className="h-3 w-3" /> View CV
                                </Button>
                              </Link>
                            ) : (
                              <Button variant="ghost" size="sm" className="h-7 text-xs" disabled>
                                No CV
                              </Button>
                            )}
                            {app.cover_letter && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setSelectedCoverLetter(app)}>
                                <FileText className="h-3 w-3" /> Cover Letter
                              </Button>
                            )}
                            {app.candidate_slug && (
                              <Link to={`/profile/${app.candidate_slug}`} target="_blank">
                                <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-3 w-3" /></Button>
                              </Link>
                            )}
                            {app.status === "applied" && (
                              <>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700" onClick={() => updateStatus(app.id, "shortlisted")}>
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => updateStatus(app.id, "rejected")}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cover Letter Dialog */}
      <Dialog open={!!selectedCoverLetter} onOpenChange={() => setSelectedCoverLetter(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {selectedCoverLetter?.candidate_name} — Cover Letter
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {selectedCoverLetter?.cover_letter}
          </p>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Applications;
