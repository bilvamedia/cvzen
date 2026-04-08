/**
 * Generate an ICS calendar file content for interview invites
 */
export function generateICS({
  title,
  description,
  location,
  startTime,
  durationMinutes,
  organizerEmail,
  attendeeEmail,
  videoLink,
}: {
  title: string;
  description: string;
  location?: string;
  startTime: Date;
  durationMinutes: number;
  organizerEmail?: string;
  attendeeEmail?: string;
  videoLink?: string;
}): string {
  const formatDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@cvzen.ai`;

  const loc = videoLink || location || "TBD";
  const desc = videoLink
    ? `${description}\\n\\nJoin: ${videoLink}`
    : description;

  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//cvZen//Interview//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTART:${formatDate(startTime)}
DTEND:${formatDate(endTime)}
SUMMARY:${title}
DESCRIPTION:${desc.replace(/\n/g, "\\n")}
LOCATION:${loc}
STATUS:CONFIRMED`;

  if (organizerEmail) {
    ics += `\nORGANIZER;CN=Recruiter:mailto:${organizerEmail}`;
  }
  if (attendeeEmail) {
    ics += `\nATTENDEE;RSVP=TRUE;CN=Candidate:mailto:${attendeeEmail}`;
  }

  ics += `
END:VEVENT
END:VCALENDAR`;

  return ics;
}

export function downloadICS(icsContent: string, filename: string) {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
