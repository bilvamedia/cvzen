import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, Pencil, Save, X, Plus, MapPin, Clock, Briefcase,
  Building2, Sun, Moon, Zap, Calendar, GraduationCap
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

interface JobPreferencesProps {
  editable?: boolean;
  userId?: string;
  profileId?: string; // for public view via RPC
}

interface PreferencesData {
  work_modes: string[];
  employment_types: string[];
  preferred_locations: string[];
  shift_preference: string;
  interview_availability: Record<string, { available: boolean; from?: string; to?: string }>;
  seniority_level: string | null;
}

const emptyPrefs: PreferencesData = {
  work_modes: [],
  employment_types: [],
  preferred_locations: [],
  shift_preference: "flexible",
  interview_availability: {},
  seniority_level: null,
};

const JobPreferences = ({ editable = false, userId, profileId }: JobPreferencesProps) => {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<PreferencesData>(emptyPrefs);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PreferencesData>(emptyPrefs);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locationInput, setLocationInput] = useState("");
  const [hasRecord, setHasRecord] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userId, profileId]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      if (profileId && !editable) {
        // Public view via RPC
        const { data } = await supabase.rpc("get_public_job_preferences", { _profile_id: profileId });
        const row = Array.isArray(data) ? data[0] : data;
        if (row) {
          setPrefs({
            work_modes: row.work_modes || [],
            employment_types: row.employment_types || [],
            preferred_locations: row.preferred_locations || [],
            shift_preference: row.shift_preference || "flexible",
            interview_availability: (row.interview_availability as any) || {},
            seniority_level: row.seniority_level || null,
          });
          setHasRecord(true);
        }
      } else if (userId) {
        const { data } = await supabase
          .from("job_preferences")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        if (data) {
          const p: PreferencesData = {
            work_modes: (data as any).work_modes || [],
            employment_types: (data as any).employment_types || [],
            preferred_locations: (data as any).preferred_locations || [],
            shift_preference: (data as any).shift_preference || "flexible",
            interview_availability: (data as any).interview_availability || {},
            seniority_level: (data as any).seniority_level || null,
          };
          setPrefs(p);
          setHasRecord(true);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    setForm({ ...prefs });
    setEditing(true);
  };

  const toggleArrayItem = (arr: string[], item: string): string[] =>
    arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];

  const addLocation = () => {
    const loc = locationInput.trim();
    if (loc && !form.preferred_locations.includes(loc)) {
      setForm(f => ({ ...f, preferred_locations: [...f.preferred_locations, loc] }));
      setLocationInput("");
    }
  };

  const removeLocation = (loc: string) => {
    setForm(f => ({ ...f, preferred_locations: f.preferred_locations.filter(l => l !== loc) }));
  };

  const toggleDay = (day: string) => {
    setForm(f => {
      const avail = { ...f.interview_availability };
      if (avail[day]?.available) {
        delete avail[day];
      } else {
        avail[day] = { available: true, from: "09:00", to: "18:00" };
      }
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
      if (hasRecord) {
        const { error } = await supabase
          .from("job_preferences")
          .update({
            work_modes: form.work_modes,
            employment_types: form.employment_types,
            preferred_locations: form.preferred_locations,
            shift_preference: form.shift_preference,
            interview_availability: form.interview_availability,
            seniority_level: form.seniority_level,
          } as any)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("job_preferences")
          .insert({
            user_id: userId,
            work_modes: form.work_modes,
            employment_types: form.employment_types,
            preferred_locations: form.preferred_locations,
            shift_preference: form.shift_preference,
            interview_availability: form.interview_availability,
            seniority_level: form.seniority_level,
          } as any);
        if (error) throw error;
        setHasRecord(true);
      }
      setPrefs({ ...form });
      setEditing(false);
      toast({ title: "Preferences saved!" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const isEmpty = !hasRecord || (
    prefs.work_modes.length === 0 &&
    prefs.employment_types.length === 0 &&
    prefs.preferred_locations.length === 0 &&
    !prefs.seniority_level
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  // Public view: hide if empty
  if (!editable && isEmpty) return null;

  const shiftIcon = (s: string) => {
    if (s.toLowerCase() === "day") return <Sun className="h-3.5 w-3.5" />;
    if (s.toLowerCase() === "night") return <Moon className="h-3.5 w-3.5" />;
    return <Zap className="h-3.5 w-3.5" />;
  };

  // === DISPLAY MODE ===
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
          <div className="space-y-4">
            {/* Seniority */}
            {prefs.seniority_level && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                  <GraduationCap className="h-3 w-3" /> Seniority Level
                </Label>
                <Badge variant="secondary" className="text-xs">{prefs.seniority_level}</Badge>
              </div>
            )}

            {/* Work Modes */}
            {prefs.work_modes.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                  <Building2 className="h-3 w-3" /> Work Mode
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {prefs.work_modes.map(m => (
                    <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Employment Types */}
            {prefs.employment_types.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                  <Clock className="h-3 w-3" /> Employment Type
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {prefs.employment_types.map(t => (
                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Locations */}
            {prefs.preferred_locations.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                  <MapPin className="h-3 w-3" /> Preferred Locations
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {prefs.preferred_locations.map(l => (
                    <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Shift */}
            {prefs.shift_preference && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                  {shiftIcon(prefs.shift_preference)} Shift Preference
                </Label>
                <Badge variant="outline" className="text-xs capitalize">{prefs.shift_preference}</Badge>
              </div>
            )}

            {/* Interview Availability */}
            {Object.keys(prefs.interview_availability).length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                  <Calendar className="h-3 w-3" /> Interview Availability
                </Label>
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
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // === EDIT MODE ===
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
          <Select
            value={form.seniority_level || ""}
            onValueChange={v => setForm(f => ({ ...f, seniority_level: v || null }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select level..." />
            </SelectTrigger>
            <SelectContent>
              {SENIORITY_LEVELS.map(l => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Work Modes */}
        <div>
          <Label className="text-sm mb-1.5 block">Work Mode</Label>
          <div className="flex flex-wrap gap-2">
            {WORK_MODES.map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setForm(f => ({ ...f, work_modes: toggleArrayItem(f.work_modes, mode) }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  form.work_modes.includes(mode)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Employment Types */}
        <div>
          <Label className="text-sm mb-1.5 block">Employment Type</Label>
          <div className="flex flex-wrap gap-2">
            {EMPLOYMENT_TYPES.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setForm(f => ({ ...f, employment_types: toggleArrayItem(f.employment_types, type) }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  form.employment_types.includes(type)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Locations */}
        <div>
          <Label className="text-sm mb-1.5 block">Preferred Locations</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={locationInput}
              onChange={e => setLocationInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addLocation())}
              placeholder="Add a city or region..."
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={addLocation} disabled={!locationInput.trim()}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          {form.preferred_locations.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.preferred_locations.map(loc => (
                <Badge key={loc} variant="secondary" className="text-xs gap-1 pr-1">
                  {loc}
                  <button type="button" onClick={() => removeLocation(loc)} className="ml-0.5 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Shift Preference */}
        <div>
          <Label className="text-sm mb-1.5 block">Shift Preference</Label>
          <div className="flex flex-wrap gap-2">
            {SHIFT_OPTIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setForm(f => ({ ...f, shift_preference: s.toLowerCase() }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
                  form.shift_preference === s.toLowerCase()
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {shiftIcon(s)} {s}
              </button>
            ))}
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
                  <button
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`w-24 px-2 py-1 rounded text-xs font-medium border text-left transition-colors ${
                      active
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-background text-muted-foreground border-border"
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                  {active && (
                    <div className="flex items-center gap-1 text-xs">
                      <input
                        type="time"
                        value={form.interview_availability[day]?.from || "09:00"}
                        onChange={e => updateDayTime(day, "from", e.target.value)}
                        className="bg-muted rounded px-2 py-1 text-xs border border-border"
                      />
                      <span className="text-muted-foreground">to</span>
                      <input
                        type="time"
                        value={form.interview_availability[day]?.to || "18:00"}
                        onChange={e => updateDayTime(day, "to", e.target.value)}
                        className="bg-muted rounded px-2 py-1 text-xs border border-border"
                      />
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
