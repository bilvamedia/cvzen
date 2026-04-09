import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  LayoutDashboard, FileText, User, Search, Target, Calendar,
  Video, Phone, MapPin, Clock, Download, Check, X, CalendarClock,
  Loader2, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateICS, downloadICS } from "@/lib/icsGenerator";

const navItems = [
  { label: "Dashboard", href: "/candidate", icon: LayoutDashboard },
  { label: "My CV", href: "/candidate/resume", icon: FileText },
  { label: "Digital Profile", href: "/candidate/profile", icon: User },
  { label: "ATS Score", href: "/candidate/ats-score", icon: Target },
  { label: "Search Jobs", href: "/candidate/search", icon: Search },
  { label: "Interviews", href: "/candidate/interviews", icon: Calendar },
  { label: "Billing", href: "/candidate/billing", icon: CreditCard },
  { label: "Settings", href: "/candidate/settings", icon: SettingsIcon },
];

interface Interview {
  id: string;
  job_id: string | null;
  recruiter_id: string;
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
  recruiter_name?: string;
  job_title?: string;
}

const modeIcons: Record<string, any> = { video: Video, phone: Phone, in_person: MapPin };
const modeLabels: Record<string, string> = { video: "Video Call", phone: "Phone Call", in_person: "In Person" };
const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  rescheduled: "bg-purple-100 text-purple-800 border-purple-200",
};

const CandidateInterviews = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleMessage, setRescheduleMessage] = useState("");
  const { toast } = useToast();

  const fetchInterviews = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("interviews")
      .select("*")
      .eq("candidate_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !data) {
      setLoading(false);
      return;
    }

    // Enrich with recruiter names and job titles
    const recruiterIds = [...new Set(data.map((i) => i.recruiter_id))];
    const jobIds = [...new Set(data.filter((i) => i.job_id).map((i) => i.job_id!))];

    const [profilesRes, jobsRes] = await Promise.all([
      recruiterIds.length > 0
        ? supabase.rpc("get_public_profile_by_slug", { _slug: "" }).then(() =>
            // Use a direct query since we need names by ID
            supabase.from("profiles").select("id, full_name").in("id", recruiterIds)
          )
        : Promise.resolve({ data: [] }),
      jobIds.length > 0
        ? supabase.from("jobs").select("id, title").in("id", jobIds)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map((profilesRes?.data || []).map((p: any) => [p.id, p.full_name]));
    const jobMap = new Map((jobsRes?.data || []).map((j: any) => [j.id, j.title]));

    setInterviews(
      data.map((i) => ({
        ...i,
        recruiter_name: profileMap.get(i.recruiter_id) || "Recruiter",
        job_title: i.job_id ? jobMap.get(i.job_id) || "Position" : undefined,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleAccept = async (interview: Interview) => {
    setActionLoading(interview.id);
    // For slot-based, pick the first proposed time; for fixed, use confirmed_time
    const time = interview.scheduling_type === "slot" && Array.isArray(interview.proposed_times) && interview.proposed_times.length > 0
      ? interview.proposed_times[0]
      : interview.confirmed_time;

    const { error } = await supabase
      .from("interviews")
      .update({ status: "confirmed", confirmed_time: time })
      .eq("id", interview.id);

    setActionLoading(null);
    if (error) {
      toast({ title: "Error", description: "Failed to accept interview.", variant: "destructive" });
    } else {
      toast({ title: "Interview Accepted", description: "The interview has been confirmed." });
      fetchInterviews();
    }
  };

  const handleAcceptSlot = async (interview: Interview, slot: string) => {
    setActionLoading(interview.id);
    const { error } = await supabase
      .from("interviews")
      .update({ status: "confirmed", confirmed_time: slot })
      .eq("id", interview.id);

    setActionLoading(null);
    if (error) {
      toast({ title: "Error", description: "Failed to confirm slot.", variant: "destructive" });
    } else {
      toast({ title: "Slot Confirmed", description: `Interview confirmed for ${new Date(slot).toLocaleString()}.` });
      fetchInterviews();
    }
  };

  const handleDecline = async (interview: Interview) => {
    setActionLoading(interview.id);
    const { error } = await supabase
      .from("interviews")
      .update({ status: "cancelled" })
      .eq("id", interview.id);

    setActionLoading(null);
    if (error) {
      toast({ title: "Error", description: "Failed to decline.", variant: "destructive" });
    } else {
      toast({ title: "Interview Declined", description: "The interview has been cancelled." });
      fetchInterviews();
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleId || !rescheduleTime) return;
    setActionLoading(rescheduleId);

    const noteAddition = rescheduleMessage
      ? `\n[Reschedule requested by candidate: ${rescheduleMessage}]`
      : "\n[Reschedule requested by candidate]";

    const interview = interviews.find((i) => i.id === rescheduleId);
    const existingNotes = interview?.notes || "";

    const { error } = await supabase
      .from("interviews")
      .update({
        status: "rescheduled",
        proposed_times: [rescheduleTime],
        notes: existingNotes + noteAddition,
      })
      .eq("id", rescheduleId);

    setActionLoading(null);
    setRescheduleId(null);
    setRescheduleTime("");
    setRescheduleMessage("");

    if (error) {
      toast({ title: "Error", description: "Failed to request reschedule.", variant: "destructive" });
    } else {
      toast({ title: "Reschedule Requested", description: "The recruiter has been notified of your preferred time." });
      fetchInterviews();
    }
  };

  const handleDownloadICS = (interview: Interview) => {
    const time = interview.confirmed_time || (Array.isArray(interview.proposed_times) && interview.proposed_times[0]);
    if (!time) return;
    const ics = generateICS({
      title: `Interview${interview.job_title ? ` - ${interview.job_title}` : ""}`,
      description: `Interview with ${interview.recruiter_name}${interview.notes ? `\n${interview.notes}` : ""}`,
      location: interview.location_details || undefined,
      startTime: new Date(time),
      durationMinutes: interview.duration_minutes,
      videoLink: interview.video_link || undefined,
    });
    downloadICS(ics, `interview-${interview.id.slice(0, 8)}.ics`);
  };

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString(undefined, {
      weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const pendingInterviews = interviews.filter((i) => ["pending", "rescheduled"].includes(i.status));
  const upcomingInterviews = interviews.filter((i) => i.status === "confirmed");
  const pastInterviews = interviews.filter((i) => ["completed", "cancelled"].includes(i.status));

  return (
    <DashboardLayout navItems={navItems} role="candidate">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : interviews.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Calendar className="h-16 w-16 mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-semibold mb-2">No Interviews Yet</h3>
          <p>When recruiters schedule interviews with you, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pending / Action Required */}
          {pendingInterviews.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Action Required ({pendingInterviews.length})
              </h2>
              <div className="space-y-4">
                {pendingInterviews.map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    actionLoading={actionLoading}
                    onAccept={handleAccept}
                    onAcceptSlot={handleAcceptSlot}
                    onDecline={handleDecline}
                    onReschedule={() => setRescheduleId(interview.id)}
                    onDownloadICS={handleDownloadICS}
                    showActions
                  />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Confirmed */}
          {upcomingInterviews.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Upcoming ({upcomingInterviews.length})
              </h2>
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    actionLoading={actionLoading}
                    onAccept={handleAccept}
                    onAcceptSlot={handleAcceptSlot}
                    onDecline={handleDecline}
                    onReschedule={() => setRescheduleId(interview.id)}
                    onDownloadICS={handleDownloadICS}
                    showActions={false}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Past */}
          {pastInterviews.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Past ({pastInterviews.length})</h2>
              <div className="space-y-4 opacity-70">
                {pastInterviews.map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    actionLoading={null}
                    onAccept={() => {}}
                    onAcceptSlot={() => {}}
                    onDecline={() => {}}
                    onReschedule={() => {}}
                    onDownloadICS={handleDownloadICS}
                    showActions={false}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleId} onOpenChange={(open) => !open && setRescheduleId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" /> Request Reschedule
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Your Preferred Time</Label>
              <Input
                type="datetime-local"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Message to Recruiter (optional)</Label>
              <Textarea
                value={rescheduleMessage}
                onChange={(e) => setRescheduleMessage(e.target.value)}
                placeholder="I'd prefer a different time because..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setRescheduleId(null)}>Cancel</Button>
              <Button onClick={handleReschedule} disabled={!rescheduleTime || actionLoading === rescheduleId}>
                {actionLoading === rescheduleId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

/* ── Interview Card ── */
interface InterviewCardProps {
  interview: Interview;
  actionLoading: string | null;
  onAccept: (i: Interview) => void;
  onAcceptSlot: (i: Interview, slot: string) => void;
  onDecline: (i: Interview) => void;
  onReschedule: () => void;
  onDownloadICS: (i: Interview) => void;
  showActions: boolean;
}

const InterviewCard = ({
  interview, actionLoading, onAccept, onAcceptSlot, onDecline, onReschedule, onDownloadICS, showActions,
}: InterviewCardProps) => {
  const ModeIcon = modeIcons[interview.mode] || Video;
  const isLoading = actionLoading === interview.id;
  const isSlotBased = interview.scheduling_type === "slot" && Array.isArray(interview.proposed_times) && interview.proposed_times.length > 0;
  const hasTime = interview.confirmed_time || (Array.isArray(interview.proposed_times) && interview.proposed_times.length > 0);

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString(undefined, {
      weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="border rounded-xl p-4 sm:p-5 bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge className={`${statusColors[interview.status] || "bg-gray-100 text-gray-800"} text-xs font-medium border`}>
              {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
            </Badge>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <ModeIcon className="h-3.5 w-3.5" />
              {modeLabels[interview.mode] || interview.mode}
            </span>
            <span className="text-sm text-muted-foreground">• {interview.duration_minutes} min</span>
          </div>

          <h3 className="font-semibold text-base truncate">
            {interview.job_title ? `${interview.job_title}` : "Interview"}
            <span className="font-normal text-muted-foreground ml-1">with {interview.recruiter_name}</span>
          </h3>

          {/* Time display */}
          {interview.confirmed_time && (
            <p className="text-sm mt-1.5 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">{formatDateTime(interview.confirmed_time)}</span>
            </p>
          )}

          {/* Slot selection for pending slot-based */}
          {showActions && isSlotBased && interview.status === "pending" && (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Pick a time slot:</p>
              <div className="flex flex-wrap gap-2">
                {(interview.proposed_times as string[]).map((slot, idx) => (
                  <Button
                    key={idx}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    disabled={isLoading}
                    onClick={() => onAcceptSlot(interview, slot)}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDateTime(slot)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Video / location info */}
          {interview.video_link && (
            <a
              href={interview.video_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline mt-1.5 inline-flex items-center gap-1"
            >
              <Video className="h-3.5 w-3.5" /> Join Video Call
            </a>
          )}
          {interview.location_details && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {interview.location_details}
            </p>
          )}

          {interview.notes && (
            <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5 bg-muted/50 p-2 rounded-lg">
              <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span className="line-clamp-3">{interview.notes}</span>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
          {showActions && interview.status === "pending" && !isSlotBased && (
            <Button size="sm" onClick={() => onAccept(interview)} disabled={isLoading} className="gap-1">
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Accept
            </Button>
          )}
          {showActions && ["pending", "rescheduled"].includes(interview.status) && (
            <>
              <Button size="sm" variant="outline" onClick={onReschedule} disabled={isLoading} className="gap-1">
                <CalendarClock className="h-3.5 w-3.5" /> Reschedule
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDecline(interview)} disabled={isLoading} className="gap-1">
                <X className="h-3.5 w-3.5" /> Decline
              </Button>
            </>
          )}
          {hasTime && ["confirmed", "completed"].includes(interview.status) && (
            <Button size="sm" variant="outline" onClick={() => onDownloadICS(interview)} className="gap-1">
              <Download className="h-3.5 w-3.5" /> .ics
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateInterviews;
