import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Loader2, Pencil, Save, X, Plus, MapPin, Clock, Briefcase,
  Building2, Sun, Moon, Zap, Calendar, GraduationCap, DollarSign,
  Globe2, Plane, Languages, Heart, Wrench, Target
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WORK_MODES = ["Remote", "Hybrid", "In-Office"];
const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract", "Freelance", "Internship"];
const SHIFT_OPTIONS = ["Day", "Night", "Flexible", "Rotational"];
const SENIORITY_LEVELS = ["Intern", "Entry Level", "Junior", "Mid Level", "Senior", "Lead", "Manager", "Director", "VP", "C-Level / Executive"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const COMPANY_SIZES = ["Startup (1-50)", "Small (51-200)", "Mid-size (201-1000)", "Large (1001-5000)", "Enterprise (5000+)"];
const TRAVEL_OPTIONS = ["No Travel", "Up to 10%", "Up to 25%", "Up to 50%", "50%+", "Fully Travel-Based"];
const NOTICE_PERIODS = ["Immediately", "1 Week", "2 Weeks", "1 Month", "2 Months", "3 Months", "6 Months"];
const CURRENCIES = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "SGD", "AED"];
const INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "Education", "E-Commerce", "Manufacturing",
  "Media & Entertainment", "Real Estate", "Consulting", "Legal", "Nonprofit",
  "Government", "Energy", "Retail", "Automotive", "Telecom", "Agriculture",
  "Hospitality", "Logistics", "Aerospace & Defense"
];
const BENEFITS = [
  "Health Insurance", "Dental & Vision", "Equity / Stock Options", "Remote Work",
  "Flexible Hours", "401(k) / Pension", "Paid Time Off", "Learning Budget",
  "Gym / Wellness", "Parental Leave", "Relocation Assistance", "Signing Bonus",
  "Performance Bonus", "Company Car", "Childcare Support", "Mental Health Support"
];
const JOB_FUNCTIONS = [
  "Engineering", "Product", "Design", "Data Science", "DevOps / SRE",
  "Marketing", "Sales", "Customer Success", "Operations", "HR / People",
  "Finance / Accounting", "Legal", "Research", "Quality Assurance",
  "Project Management", "Business Development", "Content / Writing",
  "Support / Help Desk", "Security", "Administration"
];

interface JobPreferencesProps {
  editable?: boolean;
  userId?: string;
  profileId?: string;
}

interface PreferencesData {
  work_modes: string[];
  employment_types: string[];
  preferred_locations: string[];
  shift_preference: string;
  interview_availability: Record<string, { available: boolean; from?: string; to?: string }>;
  seniority_level: string | null;
  expected_salary_min: number | null;
  expected_salary_max: number | null;
  salary_currency: string;
  industries: string[];
  company_sizes: string[];
  notice_period: string | null;
  willing_to_relocate: boolean;
  travel_willingness: string | null;
  languages: string[];
  visa_sponsorship_needed: boolean;
  benefits_priorities: string[];
  tools_technologies: string[];
  job_functions: string[];
}

const emptyPrefs: PreferencesData = {
  work_modes: [],
  employment_types: [],
  preferred_locations: [],
  shift_preference: "flexible",
  interview_availability: {},
  seniority_level: null,
  expected_salary_min: null,
  expected_salary_max: null,
  salary_currency: "USD",
  industries: [],
  company_sizes: [],
  notice_period: null,
  willing_to_relocate: false,
  travel_willingness: null,
  languages: [],
  visa_sponsorship_needed: false,
  benefits_priorities: [],
  tools_technologies: [],
  job_functions: [],
};

const JobPreferences = ({ editable = false, userId, profileId }: JobPreferencesProps) => {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<PreferencesData>(emptyPrefs);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PreferencesData>(emptyPrefs);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locationInput, setLocationInput] = useState("");
  const [langInput, setLangInput] = useState("");
  const [toolInput, setToolInput] = useState("");
  const [hasRecord, setHasRecord] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userId, profileId]);

  const mapRow = (row: any): PreferencesData => ({
    work_modes: row.work_modes || [],
    employment_types: row.employment_types || [],
    preferred_locations: row.preferred_locations || [],
    shift_preference: row.shift_preference || "flexible",
    interview_availability: row.interview_availability || {},
    seniority_level: row.seniority_level || null,
    expected_salary_min: row.expected_salary_min ?? null,
    expected_salary_max: row.expected_salary_max ?? null,
    salary_currency: row.salary_currency || "USD",
    industries: row.industries || [],
    company_sizes: row.company_sizes || [],
    notice_period: row.notice_period || null,
    willing_to_relocate: row.willing_to_relocate ?? false,
    travel_willingness: row.travel_willingness || null,
    languages: row.languages || [],
    visa_sponsorship_needed: row.visa_sponsorship_needed ?? false,
    benefits_priorities: row.benefits_priorities || [],
    tools_technologies: row.tools_technologies || [],
    job_functions: row.job_functions || [],
  });

  const loadPreferences = async () => {
    setLoading(true);
    try {
      if (profileId && !editable) {
        const { data } = await supabase.rpc("get_public_job_preferences", { _profile_id: profileId });
        const row = Array.isArray(data) ? data[0] : data;
        if (row) { setPrefs(mapRow(row)); setHasRecord(true); }
      } else if (userId) {
        const { data } = await supabase.from("job_preferences").select("*").eq("user_id", userId).maybeSingle();
        if (data) { setPrefs(mapRow(data)); setHasRecord(true); }
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const startEditing = () => { setForm({ ...prefs }); setEditing(true); };

  const toggleArrayItem = (arr: string[], item: string): string[] =>
    arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];

  const addTagItem = (field: keyof PreferencesData, value: string) => {
    const v = value.trim();
    if (v && !(form[field] as string[]).includes(v)) {
      setForm(f => ({ ...f, [field]: [...(f[field] as string[]), v] }));
    }
  };

  const removeTagItem = (field: keyof PreferencesData, value: string) => {
    setForm(f => ({ ...f, [field]: (f[field] as string[]).filter(x => x !== value) }));
  };

  const toggleDay = (day: string) => {
    setForm(f => {
      const avail = { ...f.interview_availability };
      if (avail[day]?.available) { delete avail[day]; }
      else { avail[day] = { available: true, from: "09:00", to: "18:00" }; }
      return { ...f, interview_availability: avail };
    });
  };

  const updateDayTime = (day: string, field: "from" | "to", value: string) => {
    setForm(f => {
      const avail = { ...f.interview_availability };
      avail[day] = { ...avail[day], [field]: value };
      return { ...f, interview_availability: avail };
    });
  };

  const savePreferences = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const payload = {
        work_modes: form.work_modes,
        employment_types: form.employment_types,
        preferred_locations: form.preferred_locations,
        shift_preference: form.shift_preference,
        interview_availability: form.interview_availability,
        seniority_level: form.seniority_level,
        expected_salary_min: form.expected_salary_min,
        expected_salary_max: form.expected_salary_max,
        salary_currency: form.salary_currency,
        industries: form.industries,
        company_sizes: form.company_sizes,
        notice_period: form.notice_period,
        willing_to_relocate: form.willing_to_relocate,
        travel_willingness: form.travel_willingness,
        languages: form.languages,
        visa_sponsorship_needed: form.visa_sponsorship_needed,
        benefits_priorities: form.benefits_priorities,
        tools_technologies: form.tools_technologies,
        job_functions: form.job_functions,
      } as any;

      if (hasRecord) {
        const { error } = await supabase.from("job_preferences").update(payload).eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("job_preferences").insert({ user_id: userId, ...payload });
        if (error) throw error;
        setHasRecord(true);
      }
      setPrefs({ ...form });
      setEditing(false);
      toast({ title: "Preferences saved!" });

      // Generate embeddings for job preferences in the background
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          supabase.functions.invoke("generate-embeddings", {
            body: { preferencesUserId: userId },
          }).then(res => {
            if (res.error) console.warn("Preferences embedding failed:", res.error);
            else console.log("Preferences embedding generated");
          });
        }
      } catch (embErr) {
        console.warn("Failed to trigger preferences embedding:", embErr);
      }
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const isEmpty = !hasRecord || (
    prefs.work_modes.length === 0 && prefs.employment_types.length === 0 &&
    prefs.preferred_locations.length === 0 && !prefs.seniority_level &&
    !prefs.expected_salary_min && prefs.industries.length === 0 &&
    prefs.job_functions.length === 0 && prefs.languages.length === 0
  );

  if (loading) return <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (!editable && isEmpty) return null;

  const shiftIcon = (s: string) => {
    if (s.toLowerCase() === "day") return <Sun className="h-3.5 w-3.5" />;
    if (s.toLowerCase() === "night") return <Moon className="h-3.5 w-3.5" />;
    return <Zap className="h-3.5 w-3.5" />;
  };

  const formatSalary = (min: number | null, max: number | null, cur: string) => {
    if (!min && !max) return null;
    const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : n.toString();
    if (min && max) return `${cur} ${fmt(min)} – ${fmt(max)}`;
    if (min) return `${cur} ${fmt(min)}+`;
    return `Up to ${cur} ${fmt(max!)}`;
  };

  // ======================== CHIP TOGGLE HELPER ========================
  const ChipToggle = ({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (item: string) => void }) => (
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <button
          key={item}
          type="button"
          onClick={() => onToggle(item)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            selected.includes(item)
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:border-primary/50"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );

  // ======================== TAG INPUT HELPER ========================
  const TagInput = ({ value, onChange, onAdd, items, onRemove, placeholder }: {
    value: string; onChange: (v: string) => void; onAdd: () => void; items: string[]; onRemove: (v: string) => void; placeholder: string;
  }) => (
    <div>
      <div className="flex gap-2 mb-2">
        <Input
          value={value} onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), onAdd())}
          placeholder={placeholder} className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={onAdd} disabled={!value.trim()}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map(item => (
            <Badge key={item} variant="secondary" className="text-xs gap-1 pr-1">
              {item}
              <button type="button" onClick={() => onRemove(item)} className="ml-0.5 hover:text-destructive"><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );

  // ======================== DISPLAY SECTION HELPER ========================
  const DisplaySection = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
    <div>
      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">{icon} {label}</Label>
      {children}
    </div>
  );

  const BadgeList = ({ items }: { items: string[] }) => (
    <div className="flex flex-wrap gap-1.5">
      {items.map(m => <Badge key={m} variant="outline" className="text-xs">{m}</Badge>)}
    </div>
  );

  // ======================== DISPLAY MODE ========================
  if (!editing) {
    return (
      <div className="bg-card rounded-xl shadow-card border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" /> Job Preferences
          </h2>
          {editable && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={startEditing}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {isEmpty && editable ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">Set your job preferences to help recruiters find you.</p>
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Preferences
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prefs.seniority_level && (
              <DisplaySection icon={<GraduationCap className="h-3 w-3" />} label="Seniority Level">
                <Badge variant="secondary" className="text-xs">{prefs.seniority_level}</Badge>
              </DisplaySection>
            )}
            {prefs.job_functions.length > 0 && (
              <DisplaySection icon={<Target className="h-3 w-3" />} label="Job Functions">
                <BadgeList items={prefs.job_functions} />
              </DisplaySection>
            )}
            {prefs.work_modes.length > 0 && (
              <DisplaySection icon={<Building2 className="h-3 w-3" />} label="Work Mode">
                <BadgeList items={prefs.work_modes} />
              </DisplaySection>
            )}
            {prefs.employment_types.length > 0 && (
              <DisplaySection icon={<Clock className="h-3 w-3" />} label="Employment Type">
                <BadgeList items={prefs.employment_types} />
              </DisplaySection>
            )}
            {formatSalary(prefs.expected_salary_min, prefs.expected_salary_max, prefs.salary_currency) && (
              <DisplaySection icon={<DollarSign className="h-3 w-3" />} label="Expected Salary">
                <Badge variant="outline" className="text-xs">{formatSalary(prefs.expected_salary_min, prefs.expected_salary_max, prefs.salary_currency)}</Badge>
              </DisplaySection>
            )}
            {prefs.preferred_locations.length > 0 && (
              <DisplaySection icon={<MapPin className="h-3 w-3" />} label="Preferred Locations">
                <BadgeList items={prefs.preferred_locations} />
              </DisplaySection>
            )}
            {prefs.industries.length > 0 && (
              <DisplaySection icon={<Building2 className="h-3 w-3" />} label="Preferred Industries">
                <BadgeList items={prefs.industries} />
              </DisplaySection>
            )}
            {prefs.company_sizes.length > 0 && (
              <DisplaySection icon={<Building2 className="h-3 w-3" />} label="Company Size">
                <BadgeList items={prefs.company_sizes} />
              </DisplaySection>
            )}
            {prefs.shift_preference && (
              <DisplaySection icon={shiftIcon(prefs.shift_preference)} label="Shift Preference">
                <Badge variant="outline" className="text-xs capitalize">{prefs.shift_preference}</Badge>
              </DisplaySection>
            )}
            {prefs.notice_period && (
              <DisplaySection icon={<Calendar className="h-3 w-3" />} label="Notice Period">
                <Badge variant="outline" className="text-xs">{prefs.notice_period}</Badge>
              </DisplaySection>
            )}
            {prefs.travel_willingness && (
              <DisplaySection icon={<Plane className="h-3 w-3" />} label="Travel Willingness">
                <Badge variant="outline" className="text-xs">{prefs.travel_willingness}</Badge>
              </DisplaySection>
            )}
            {prefs.languages.length > 0 && (
              <DisplaySection icon={<Languages className="h-3 w-3" />} label="Languages">
                <BadgeList items={prefs.languages} />
              </DisplaySection>
            )}
            {prefs.tools_technologies.length > 0 && (
              <DisplaySection icon={<Wrench className="h-3 w-3" />} label="Preferred Tools & Tech">
                <BadgeList items={prefs.tools_technologies} />
              </DisplaySection>
            )}
            {prefs.benefits_priorities.length > 0 && (
              <DisplaySection icon={<Heart className="h-3 w-3" />} label="Benefits Priorities">
                <BadgeList items={prefs.benefits_priorities} />
              </DisplaySection>
            )}
            {(prefs.willing_to_relocate || prefs.visa_sponsorship_needed) && (
              <DisplaySection icon={<Globe2 className="h-3 w-3" />} label="Other">
                <div className="flex flex-wrap gap-1.5">
                  {prefs.willing_to_relocate && <Badge variant="outline" className="text-xs">Open to Relocation</Badge>}
                  {prefs.visa_sponsorship_needed && <Badge variant="outline" className="text-xs">Visa Sponsorship Needed</Badge>}
                </div>
              </DisplaySection>
            )}
            {Object.keys(prefs.interview_availability).length > 0 && (
              <div className="sm:col-span-2">
                <DisplaySection icon={<Calendar className="h-3 w-3" />} label="Interview Availability">
                  <div className="space-y-1">
                    {DAYS.filter(d => prefs.interview_availability[d]?.available).map(day => {
                      const slot = prefs.interview_availability[day];
                      return (
                        <div key={day} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground w-20">{day}</span>
                          <span>{slot.from || "09:00"} – {slot.to || "18:00"}</span>
                        </div>
                      );
                    })}
                  </div>
                </DisplaySection>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ======================== EDIT MODE ========================
  return (
    <div className="bg-card rounded-xl shadow-card border border-primary/20 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" /> Edit Job Preferences
        </h2>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditing(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-5">
        {/* Seniority Level */}
        <div>
          <Label className="text-sm mb-1.5 block">Seniority Level</Label>
          <Select value={form.seniority_level || ""} onValueChange={v => setForm(f => ({ ...f, seniority_level: v || null }))}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select level..." /></SelectTrigger>
            <SelectContent>{SENIORITY_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {/* Job Functions */}
        <div>
          <Label className="text-sm mb-1.5 block">Job Functions / Departments</Label>
          <ChipToggle items={JOB_FUNCTIONS} selected={form.job_functions} onToggle={f => setForm(p => ({ ...p, job_functions: toggleArrayItem(p.job_functions, f) }))} />
        </div>

        {/* Work Modes */}
        <div>
          <Label className="text-sm mb-1.5 block">Work Mode</Label>
          <ChipToggle items={WORK_MODES} selected={form.work_modes} onToggle={m => setForm(f => ({ ...f, work_modes: toggleArrayItem(f.work_modes, m) }))} />
        </div>

        {/* Employment Types */}
        <div>
          <Label className="text-sm mb-1.5 block">Employment Type</Label>
          <ChipToggle items={EMPLOYMENT_TYPES} selected={form.employment_types} onToggle={t => setForm(f => ({ ...f, employment_types: toggleArrayItem(f.employment_types, t) }))} />
        </div>

        {/* Salary Expectations */}
        <div>
          <Label className="text-sm mb-1.5 block">Expected Salary (Annual)</Label>
          <div className="flex gap-2 items-center">
            <Select value={form.salary_currency} onValueChange={v => setForm(f => ({ ...f, salary_currency: v }))}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Input
              type="number" placeholder="Min"
              value={form.expected_salary_min ?? ""}
              onChange={e => setForm(f => ({ ...f, expected_salary_min: e.target.value ? parseInt(e.target.value) : null }))}
              className="flex-1"
            />
            <span className="text-muted-foreground text-sm">–</span>
            <Input
              type="number" placeholder="Max"
              value={form.expected_salary_max ?? ""}
              onChange={e => setForm(f => ({ ...f, expected_salary_max: e.target.value ? parseInt(e.target.value) : null }))}
              className="flex-1"
            />
          </div>
        </div>

        {/* Preferred Locations */}
        <div>
          <Label className="text-sm mb-1.5 block">Preferred Locations</Label>
          <TagInput
            value={locationInput} onChange={setLocationInput}
            onAdd={() => { addTagItem("preferred_locations", locationInput); setLocationInput(""); }}
            items={form.preferred_locations} onRemove={v => removeTagItem("preferred_locations", v)}
            placeholder="Add a city or region..."
          />
        </div>

        {/* Industries */}
        <div>
          <Label className="text-sm mb-1.5 block">Preferred Industries</Label>
          <ChipToggle items={INDUSTRIES} selected={form.industries} onToggle={i => setForm(f => ({ ...f, industries: toggleArrayItem(f.industries, i) }))} />
        </div>

        {/* Company Sizes */}
        <div>
          <Label className="text-sm mb-1.5 block">Preferred Company Size</Label>
          <ChipToggle items={COMPANY_SIZES} selected={form.company_sizes} onToggle={s => setForm(f => ({ ...f, company_sizes: toggleArrayItem(f.company_sizes, s) }))} />
        </div>

        {/* Shift Preference */}
        <div>
          <Label className="text-sm mb-1.5 block">Shift Preference</Label>
          <div className="flex flex-wrap gap-2">
            {SHIFT_OPTIONS.map(s => (
              <button key={s} type="button" onClick={() => setForm(f => ({ ...f, shift_preference: s.toLowerCase() }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
                  form.shift_preference === s.toLowerCase()
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                }`}
              >{shiftIcon(s)} {s}</button>
            ))}
          </div>
        </div>

        {/* Notice Period */}
        <div>
          <Label className="text-sm mb-1.5 block">Notice Period</Label>
          <Select value={form.notice_period || ""} onValueChange={v => setForm(f => ({ ...f, notice_period: v || null }))}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select notice period..." /></SelectTrigger>
            <SelectContent>{NOTICE_PERIODS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {/* Travel */}
        <div>
          <Label className="text-sm mb-1.5 block">Travel Willingness</Label>
          <Select value={form.travel_willingness || ""} onValueChange={v => setForm(f => ({ ...f, travel_willingness: v || null }))}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select travel preference..." /></SelectTrigger>
            <SelectContent>{TRAVEL_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {/* Languages */}
        <div>
          <Label className="text-sm mb-1.5 block">Languages</Label>
          <TagInput
            value={langInput} onChange={setLangInput}
            onAdd={() => { addTagItem("languages", langInput); setLangInput(""); }}
            items={form.languages} onRemove={v => removeTagItem("languages", v)}
            placeholder="e.g. English, Hindi, Spanish..."
          />
        </div>

        {/* Tools & Technologies */}
        <div>
          <Label className="text-sm mb-1.5 block">Preferred Tools & Technologies</Label>
          <TagInput
            value={toolInput} onChange={setToolInput}
            onAdd={() => { addTagItem("tools_technologies", toolInput); setToolInput(""); }}
            items={form.tools_technologies} onRemove={v => removeTagItem("tools_technologies", v)}
            placeholder="e.g. React, Figma, Salesforce..."
          />
        </div>

        {/* Benefits */}
        <div>
          <Label className="text-sm mb-1.5 block">Benefits Priorities</Label>
          <ChipToggle items={BENEFITS} selected={form.benefits_priorities} onToggle={b => setForm(f => ({ ...f, benefits_priorities: toggleArrayItem(f.benefits_priorities, b) }))} />
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Open to Relocation</Label>
            <Switch checked={form.willing_to_relocate} onCheckedChange={v => setForm(f => ({ ...f, willing_to_relocate: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Visa Sponsorship Needed</Label>
            <Switch checked={form.visa_sponsorship_needed} onCheckedChange={v => setForm(f => ({ ...f, visa_sponsorship_needed: v }))} />
          </div>
        </div>

        {/* Interview Availability */}
        <div>
          <Label className="text-sm mb-1.5 block">Interview Availability</Label>
          <div className="space-y-2">
            {DAYS.map(day => {
              const active = !!form.interview_availability[day]?.available;
              return (
                <div key={day} className="flex items-center gap-3">
                  <button type="button" onClick={() => toggleDay(day)}
                    className={`w-24 px-2 py-1 rounded text-xs font-medium border text-left transition-colors ${
                      active ? "bg-primary/10 text-primary border-primary/30" : "bg-background text-muted-foreground border-border"
                    }`}
                  >{day.slice(0, 3)}</button>
                  {active && (
                    <div className="flex items-center gap-1 text-xs">
                      <input type="time" value={form.interview_availability[day]?.from || "09:00"} onChange={e => updateDayTime(day, "from", e.target.value)} className="bg-muted rounded px-2 py-1 text-xs border border-border" />
                      <span className="text-muted-foreground">to</span>
                      <input type="time" value={form.interview_availability[day]?.to || "18:00"} onChange={e => updateDayTime(day, "to", e.target.value)} className="bg-muted rounded px-2 py-1 text-xs border border-border" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Save / Cancel */}
      <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border">
        <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
        <Button size="sm" onClick={savePreferences} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
};

export default JobPreferences;
