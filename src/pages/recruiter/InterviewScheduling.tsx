import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  LayoutDashboard, FileText, Search, PlusCircle, Calendar, Video, Phone, MapPin,
  Plus, Clock, Loader2, Download, Check, X, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateICS, downloadICS } from "@/lib/icsGenerator";

const navItems = [
  { label: "Dashboard", href: "/recruiter", icon: LayoutDashboard },
  { label: "Post Job", href: "/recruiter/post-job", icon: PlusCircle },
  { label: "My Jobs", href: "/recruiter/jobs", icon: FileText },
  { label: "Search Candidates", href: "/recruiter/search", icon: Search },
  { label: "Interviews", href: "/recruiter/interviews", icon: Calendar },
];

interface Interview {
  id: string;
  job_id: string | null;
  candidate_id: string;
  mode: string;
  scheduling_type: string;
  proposed_times: any;
  confirmed_time: string | null;
  duration_minutes: number;
  location_details: string | null;
  video_link: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  candidate_name?: string;
  job_title?: string;
}

const modeIcons: Record<string, any> = { video: Video, phone: Phone, in_person: MapPin };
const modeLabels: Record<string, string> = { video: "Video Call", phone: "Phone Call", in_person: "In Person" };
const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

const InterviewScheduling = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();

  // Create form
  const [candidateEmail, setCandidateEmail] = useState("");
  const [jobId, setJobId] = useState("");
  const [mode, setMode] = useState("video");
  const [schedulingType, setSchedulingType] = useState("fixed");
  const [fixedTime, setFixedTime] = useState("");
  const [slotTimes, setSlotTimes] = useState<string[]>([""]);
  const [duration, setDuration] = useState("60");
  const [locationDetails, setLocationDetails] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [intResult, jobResult] = await Promise.all([
      supabase.from("interviews").select("*").eq("recruiter_id", user.id).order("created_at", { ascending: false }),
      supabase.from("jobs").select("id, title").eq("recruiter_id", user.id).eq("status", "active"),
    ]);

    if (jobResult.data) setJobs(jobResult.data);

    if (intResult.data) {
      // Enrich with candidate names and job titles
      const candidateIds = [...new Set(intResult.data.map(i => i.candidate_id))];
      const jobIds = [...new Set(intResult.data.filter(i => i.job_id).map(i => i.job_id!))];

      let profiles: Record<string, string> = {};
      let jobTitles: Record<string, string> = {};

      if (candidateIds.length > 0) {
        const { data: pData } = await supabase.from("profiles").select("id, full_name").in("id", candidateIds);
        pData?.forEach(p => { profiles[p.id] = p.full_name || "Unknown"; });
      }
      if (jobIds.length > 0) {
        const { data: jData } = await supabase.from("jobs").select("id, title").in("id", jobIds);
        jData?.forEach(j => { jobTitles[j.id] = j.title; });
      }

      setInterviews(intResult.data.map(i => ({
        ...i,
        candidate_name: profiles[i.candidate_id] || "Unknown",
        job_title: i.job_id ? jobTitles[i.job_id] || "" : "",
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Find candidate by email
      const { data: profile } = await supabase.from("profiles").select("id").eq("email", candidateEmail.trim()).limit(1);
      if (!profile || profile.length === 0) throw new Error("Candidate not found with that email");

      const proposedTimes = schedulingType === "fixed" ? [fixedTime] : slotTimes.filter(Boolean);
      if (proposedTimes.length === 0) throw new Error("Please add at least one time");

      const { error } = await supabase.from("interviews").insert({
        recruiter_id: user.id,
        candidate_id: profile[0].id,
        job_id: jobId || null,
        mode,
        scheduling_type: schedulingType,
        proposed_times: proposedTimes,
        confirmed_time: schedulingType === "fixed" ? proposedTimes[0] : null,
        duration_minutes: parseInt(duration),
        location_details: locationDetails || null,
        video_link: videoLink || null,
        notes: notes || null,
        status: schedulingType === "fixed" ? "confirmed" : "pending",
      });
      if (error) throw error;

      toast({ title: "Interview scheduled!", description: schedulingType === "fixed" ? "The interview is confirmed." : "Candidate will pick a time slot." });
      setShowCreate(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setCandidateEmail(""); setJobId(""); setMode("video"); setSchedulingType("fixed");
    setFixedTime(""); setSlotTimes([""]); setDuration("60");
    setLocationDetails(""); setVideoLink(""); setNotes("");
  };

  const handleDownloadICS = (interview: Interview) => {
    const time = interview.confirmed_time || (interview.proposed_times as string[])?.[0];
    if (!time) { toast({ title: "No confirmed time", variant: "destructive" }); return; }

    const ics = generateICS({
      title: `Interview: ${interview.job_title || "Position"} — ${interview.candidate_name}`,
      description: interview.notes || `Interview with ${interview.candidate_name}`,
      location: interview.mode === "in_person" ? interview.location_details || undefined : undefined,
      startTime: new Date(time),
      durationMinutes: interview.duration_minutes,
      videoLink: interview.video_link || undefined,
    });
    downloadICS(ics, `interview-${interview.candidate_name?.replace(/\s/g, "-")}.ics`);
  };

  const cancelInterview = async (id: string) => {
    await supabase.from("interviews").update({ status: "cancelled" }).eq("id", id);
    setInterviews(interviews.map(i => i.id === id ? { ...i, status: "cancelled" } : i));
    toast({ title: "Interview cancelled" });
  };

  return (
    <DashboardLayout navItems={navItems} role="recruiter">
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Interviews</h1>
            <p className="text-muted-foreground">Schedule and manage candidate interviews.</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button variant="hero" size="sm"><Plus className="h-4 w-4 mr-1" /> Schedule Interview</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Schedule Interview</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Candidate Email *</Label>
                  <Input placeholder="candidate@example.com" value={candidateEmail} onChange={e => setCandidateEmail(e.target.value)} />
                </div>

                {jobs.length > 0 && (
                  <div className="space-y-2">
                    <Label>Related Job (optional)</Label>
                    <Select value={jobId} onValueChange={setJobId}>
                      <SelectTrigger><SelectValue placeholder="Select a job" /></SelectTrigger>
                      <SelectContent>
                        {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Interview Mode</Label>
                    <Select value={mode} onValueChange={setMode}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video Call</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="in_person">In Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Scheduling Type</Label>
                    <Select value={schedulingType} onValueChange={setSchedulingType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Time</SelectItem>
                        <SelectItem value="slot_based">Offer Slots</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {schedulingType === "fixed" ? (
                  <div className="space-y-2">
                    <Label>Date & Time *</Label>
                    <Input type="datetime-local" value={fixedTime} onChange={e => setFixedTime(e.target.value)} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Proposed Time Slots *</Label>
                    {slotTimes.map((slot, i) => (
                      <div key={i} className="flex gap-2">
                        <Input type="datetime-local" value={slot} onChange={e => { const n = [...slotTimes]; n[i] = e.target.value; setSlotTimes(n); }} />
                        {slotTimes.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => setSlotTimes(slotTimes.filter((_, j) => j !== i))}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => setSlotTimes([...slotTimes, ""])}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Slot
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {mode === "video" && (
                  <div className="space-y-2">
                    <Label>Video Call Link</Label>
                    <Input placeholder="https://meet.google.com/..." value={videoLink} onChange={e => setVideoLink(e.target.value)} />
                  </div>
                )}
                {mode === "in_person" && (
                  <div className="space-y-2">
                    <Label>Location Details</Label>
                    <Input placeholder="Office address, building, room..." value={locationDetails} onChange={e => setLocationDetails(e.target.value)} />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Any additional notes for the candidate..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
                </div>

                <Button onClick={handleCreate} variant="hero" className="w-full h-11" disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Calendar className="h-4 w-4 mr-1" />}
                  {creating ? "Scheduling..." : "Schedule Interview"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : interviews.length === 0 ? (
          <div className="bg-card rounded-xl p-12 shadow-card border border-border text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No interviews scheduled yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {interviews.map((interview) => {
              const ModeIcon = modeIcons[interview.mode] || Video;
              const displayTime = interview.confirmed_time || (interview.proposed_times as string[])?.[0];
              return (
                <div key={interview.id} className="bg-card rounded-xl p-5 shadow-card border border-border enterprise-border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{interview.candidate_name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[interview.status] || ""}`}>
                          {interview.status}
                        </span>
                      </div>
                      {interview.job_title && <p className="text-sm text-muted-foreground mb-2">{interview.job_title}</p>}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><ModeIcon className="h-3 w-3" />{modeLabels[interview.mode]}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{interview.duration_minutes} min</span>
                        {displayTime && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(displayTime).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {interview.scheduling_type === "slot_based" && interview.status === "pending" && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Proposed slots:</p>
                          <div className="flex flex-wrap gap-1">
                            {(interview.proposed_times as string[]).map((t, i) => (
                              <Badge key={i} variant="outline" className="text-[10px]">{new Date(t).toLocaleString()}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {interview.status !== "cancelled" && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadICS(interview)} title="Download ICS">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => cancelInterview(interview.id)} title="Cancel">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InterviewScheduling;
