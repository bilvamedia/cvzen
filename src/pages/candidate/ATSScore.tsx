import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, User, Search, Target, Loader2, TrendingUp, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Dashboard", href: "/candidate", icon: LayoutDashboard },
  { label: "My Resume", href: "/candidate/resume", icon: FileText },
  { label: "Digital Profile", href: "/candidate/profile", icon: User },
  { label: "ATS Score", href: "/candidate/ats-score", icon: Target },
  { label: "Search Jobs", href: "/candidate/search", icon: Search },
];

interface ItemFeedback {
  item_title: string;
  item_subtitle?: string;
  item_score: number;
  strengths?: string[];
  improvements: string[];
  keywords_found?: string[];
  keywords_missing?: string[];
}

interface SectionScore {
  id: string;
  section_id: string;
  section_type: string;
  section_title: string;
  score: number;
  feedback: string;
  suggestions: ItemFeedback[];
  keywords_found: string[];
  keywords_missing: string[];
}

interface ScoreHistory {
  id: string;
  overall_score: number;
  section_scores: { section_type: string; section_title: string; score: number }[];
  created_at: string;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
};

const getScoreBg = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  return "Poor";
};

const ATSScore = () => {
  const { toast } = useToast();
  const [sectionScores, setSectionScores] = useState<SectionScore[]>([]);
  const [history, setHistory] = useState<ScoreHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [improvingKey, setImprovingKey] = useState<string | null>(null);
  const [improvedSections, setImprovedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get latest parsed resume
    const { data: resume } = await supabase
      .from("resumes")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "parsed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!resume) {
      setLoading(false);
      return;
    }
    setResumeId(resume.id);

    // Load scores, history, and improved sections in parallel
    const [scoresRes, historyRes, sectionsRes] = await Promise.all([
      supabase
        .from("ats_section_scores")
        .select("*")
        .eq("resume_id", resume.id)
        .order("score", { ascending: true }),
      supabase
        .from("ats_score_history")
        .select("*")
        .eq("resume_id", resume.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("resume_sections")
        .select("id, improved_content")
        .eq("resume_id", resume.id),
    ]);

    if (scoresRes.data) {
      const normalized = scoresRes.data.map((s: any) => ({
        ...s,
        suggestions: Array.isArray(s.suggestions) ? s.suggestions.map((item: any) => ({
          ...item,
          strengths: Array.isArray(item.strengths) ? item.strengths : [],
          improvements: Array.isArray(item.improvements) ? item.improvements : [],
          keywords_found: Array.isArray(item.keywords_found) ? item.keywords_found : [],
          keywords_missing: Array.isArray(item.keywords_missing) ? item.keywords_missing : [],
        })) : [],
        keywords_found: Array.isArray(s.keywords_found) ? s.keywords_found : [],
        keywords_missing: Array.isArray(s.keywords_missing) ? s.keywords_missing : [],
      }));
      setSectionScores(normalized);
    }
    if (historyRes.data) setHistory(historyRes.data as any);
    if (sectionsRes.data) {
      const improved = new Set<string>();
      sectionsRes.data.forEach((s: any) => {
        if (s.improved_content) improved.add(s.id);
      });
      setImprovedSections(improved);
    }
    setLoading(false);
  };

  const improveItem = async (sectionId: string, itemIndex: number) => {
    const key = `${sectionId}-${itemIndex}`;
    setImprovingKey(key);
    try {
      const { data, error } = await supabase.functions.invoke("improve-section", {
        body: { sectionId, itemIndex },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setImprovedSections(prev => new Set(prev).add(sectionId));
      toast({ title: "Item improved!", description: "The improved version is now shown on your digital profile." });
    } catch (err: any) {
      toast({ title: "Improvement failed", description: err.message, variant: "destructive" });
    } finally {
      setImprovingKey(null);
    }
  };

  const runScoring = async () => {
    if (!resumeId) {
      toast({ title: "No resume found", description: "Please upload and parse a resume first.", variant: "destructive" });
      return;
    }
    setScoring(true);
    try {
      const { data, error } = await supabase.functions.invoke("ats-score", {
        body: { resumeId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "ATS Scoring Complete!", description: `Overall score: ${data.overall_score}/100` });
      await loadData();
    } catch (err: any) {
      toast({ title: "Scoring failed", description: err.message, variant: "destructive" });
    } finally {
      setScoring(false);
    }
  };

  const overallScore = sectionScores.length > 0
    ? Math.round(sectionScores.reduce((sum, s) => sum + s.score, 0) / sectionScores.length)
    : 0;

  // Calculate improvement from history
  const latestImprovement = history.length >= 2
    ? history[0].overall_score - history[1].overall_score
    : null;

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} role="candidate">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} role="candidate">
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">ATS Score Analysis</h1>
            <p className="text-muted-foreground">Section-by-section ATS compatibility scoring with improvement tracking.</p>
          </div>
          <Button variant="hero" onClick={runScoring} disabled={scoring || !resumeId}>
            {scoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {scoring ? "Scoring..." : sectionScores.length > 0 ? "Re-Score" : "Run ATS Score"}
          </Button>
        </div>

        {!resumeId && (
          <div className="bg-card rounded-xl p-8 shadow-card border border-border text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No parsed resume found. Upload and parse your resume first.</p>
          </div>
        )}

        {resumeId && sectionScores.length === 0 && !scoring && (
          <div className="bg-card rounded-xl p-8 shadow-card border border-border text-center">
            <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Click "Run ATS Score" to analyze your resume sections.</p>
          </div>
        )}

        {sectionScores.length > 0 && (
          <>
            {/* Overall Score Card */}
            <div className="bg-card rounded-xl shadow-card border border-border p-6 mb-6">
              <div className="flex items-center gap-6">
                <div className="relative h-28 w-28 shrink-0">
                  <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                    <circle
                      cx="60" cy="60" r="52" fill="none"
                      stroke={overallScore >= 80 ? "#22c55e" : overallScore >= 60 ? "#eab308" : overallScore >= 40 ? "#f97316" : "#ef4444"}
                      strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${(overallScore / 100) * 327} 327`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">/ 100</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground">Overall ATS Score</h2>
                  <p className={`text-sm font-medium ${getScoreColor(overallScore)}`}>{getScoreLabel(overallScore)}</p>
                  {latestImprovement !== null && (
                    <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${latestImprovement > 0 ? "text-green-600" : latestImprovement < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                      <TrendingUp className="h-4 w-4" />
                      {latestImprovement > 0 ? "+" : ""}{latestImprovement} points since last scan
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{sectionScores.length} sections analyzed</p>
                </div>
              </div>
            </div>

            {/* Score Improvement History */}
            {history.length > 1 && (
              <div className="bg-card rounded-xl shadow-card border border-border p-5 mb-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Score History
                </h3>
                <div className="flex items-end gap-2 h-24">
                  {[...history].reverse().map((h, i) => {
                    const maxH = Math.max(...history.map(x => x.overall_score), 1);
                    const heightPct = (h.overall_score / 100) * 100;
                    return (
                      <div key={h.id} className="flex-1 flex flex-col items-center gap-1">
                        <span className={`text-xs font-medium ${getScoreColor(h.overall_score)}`}>{h.overall_score}</span>
                        <div
                          className={`w-full rounded-t ${getScoreBg(h.overall_score)} transition-all`}
                          style={{ height: `${heightPct}%`, minHeight: 4 }}
                        />
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(h.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section-by-Section Scores */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Section Scores</h3>
              {sectionScores.map((section) => {
                const isExpanded = expandedSection === section.id;
                return (
                  <div key={section.id} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
                    <button
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
                      onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground truncate">{section.section_title}</h4>
                          <Badge variant="outline" className="text-[10px] shrink-0">{section.section_type}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <Progress value={section.score} className={`h-2 flex-1 [&>div]:${getScoreBg(section.score)}`} />
                          <span className={`text-sm font-bold tabular-nums ${getScoreColor(section.score)}`}>
                            {section.score}
                          </span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
                        {/* Feedback */}
                        <div>
                          <p className="text-sm text-muted-foreground">{section.feedback}</p>
                        </div>

                        {/* Per-Item Feedback */}
                        {section.suggestions.length > 0 && (
                          <div className="space-y-3">
                            <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-primary" /> Item-by-Item Analysis
                            </h5>
                            {section.suggestions.map((item: ItemFeedback, idx: number) => (
                              <div key={idx} className="bg-muted/30 rounded-lg p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-medium text-sm text-foreground">{item.item_title}</span>
                                    {item.item_subtitle && (
                                      <span className="text-xs text-muted-foreground ml-2">— {item.item_subtitle}</span>
                                    )}
                                  </div>
                                  <span className={`text-sm font-bold tabular-nums ${getScoreColor(item.item_score)}`}>
                                    {item.item_score}/100
                                  </span>
                                </div>

                                {item.strengths && item.strengths.length > 0 && (
                                  <div>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-green-600">Strengths</span>
                                    <ul className="mt-1 space-y-0.5">
                                      {item.strengths.map((s, i) => (
                                        <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                                          <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                                          <span>{s}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {item.improvements.length > 0 && (
                                  <div>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-600">Improvements</span>
                                    <ul className="mt-1 space-y-0.5">
                                      {item.improvements.map((s, i) => (
                                        <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                                          <span className="text-orange-500 shrink-0">→</span>
                                          <span>{s}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {((item.keywords_found && item.keywords_found.length > 0) || (item.keywords_missing && item.keywords_missing.length > 0)) && (
                                  <div className="flex flex-wrap gap-1 pt-1">
                                    {item.keywords_found?.map((k, i) => (
                                      <Badge key={`f-${i}`} variant="secondary" className="text-[10px] bg-green-50 text-green-700 border-green-200">{k}</Badge>
                                    ))}
                                    {item.keywords_missing?.map((k, i) => (
                                      <Badge key={`m-${i}`} variant="outline" className="text-[10px] border-red-200 text-red-600">{k}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Section-level Keywords */}
                        <div className="grid grid-cols-2 gap-4">
                          {section.keywords_found.length > 0 && (
                            <div>
                              <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-green-500" /> Section Keywords Found
                              </h5>
                              <div className="flex flex-wrap gap-1">
                                {section.keywords_found.map((k, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    {k}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {section.keywords_missing.length > 0 && (
                            <div>
                              <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 text-red-500" /> Missing Keywords
                              </h5>
                              <div className="flex flex-wrap gap-1">
                                {section.keywords_missing.map((k, i) => (
                                  <Badge key={i} variant="outline" className="text-xs border-red-200 text-red-600">
                                    {k}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Improve Button */}
                        <div className="pt-2 border-t border-border">
                          {improvedSections.has(section.section_id) ? (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="font-medium">Improved — showing on your digital profile</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="ml-auto"
                                onClick={() => improveSection(section.section_id)}
                                disabled={improvingSection === section.section_id}
                              >
                                {improvingSection === section.section_id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                )}
                                Re-improve
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="hero"
                              size="sm"
                              className="w-full"
                              onClick={() => improveSection(section.section_id)}
                              disabled={improvingSection === section.section_id}
                            >
                              {improvingSection === section.section_id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Improving with AI...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Improve This Section with AI
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ATSScore;
