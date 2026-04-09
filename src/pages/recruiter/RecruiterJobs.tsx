import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, Search, PlusCircle, Calendar, Briefcase, MapPin, Clock, Trash2, MoreVertical, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const navItems = [
  { label: "Dashboard", href: "/recruiter", icon: LayoutDashboard },
  { label: "Post Job", href: "/recruiter/post-job", icon: PlusCircle },
  { label: "My Jobs", href: "/recruiter/jobs", icon: FileText },
  { label: "Applications", href: "/recruiter/applications", icon: Inbox },
  { label: "Search Candidates", href: "/recruiter/search", icon: Search },
  { label: "Interviews", href: "/recruiter/interviews", icon: Calendar },
];

interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  employment_type: string;
  status: string;
  created_at: string;
  skills: any;
}

const RecruiterJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchJobs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("jobs")
      .select("id, title, company, location, employment_type, status, created_at, skills")
      .eq("recruiter_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setJobs(data);
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "active" ? "closed" : "active";
    await supabase.from("jobs").update({ status: newStatus }).eq("id", id);
    setJobs(jobs.map(j => j.id === id ? { ...j, status: newStatus } : j));
    toast({ title: `Job ${newStatus === "active" ? "reopened" : "closed"}` });
  };

  const deleteJob = async (id: string) => {
    await supabase.from("jobs").delete().eq("id", id);
    setJobs(jobs.filter(j => j.id !== id));
    toast({ title: "Job deleted" });
  };

  const typeLabels: Record<string, string> = {
    full_time: "Full-time", part_time: "Part-time", contract: "Contract", internship: "Internship",
  };

  return (
    <DashboardLayout navItems={navItems} role="recruiter">
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">My Jobs</h1>
            <p className="text-muted-foreground">Manage your posted job listings.</p>
          </div>
          <Link to="/recruiter/post-job">
            <Button variant="hero" size="sm"><PlusCircle className="h-4 w-4 mr-1" /> New Job</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="bg-card rounded-xl p-12 shadow-card border border-border text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No jobs posted yet. Create your first job listing.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="bg-card rounded-xl p-5 shadow-card border border-border enterprise-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
                      <Badge variant={job.status === "active" ? "default" : "secondary"} className="text-[10px]">
                        {job.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{job.company}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                      <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{typeLabels[job.employment_type] || job.employment_type}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                    {Array.isArray(job.skills) && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(job.skills as string[]).slice(0, 5).map((s) => (
                          <Badge key={s} variant="outline" className="text-[10px] py-0">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleStatus(job.id, job.status)}>
                        {job.status === "active" ? "Close Job" : "Reopen Job"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteJob(job.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RecruiterJobs;
