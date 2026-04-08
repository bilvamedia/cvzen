import { useState, useCallback, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, User, Search, Upload, CheckCircle2, Loader2, AlertCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ResumeSections from "@/components/ResumeSections";

const navItems = [
  { label: "Dashboard", href: "/candidate", icon: LayoutDashboard },
  { label: "My Resume", href: "/candidate/resume", icon: FileText },
  { label: "Digital Profile", href: "/candidate/profile", icon: User },
  { label: "ATS Score", href: "/candidate/ats-score", icon: Target },
  { label: "Search Jobs", href: "/candidate/search", icon: Search },
];

const ResumeUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resumeStatus, setResumeStatus] = useState<string | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const { toast } = useToast();

  // Load existing resume on mount
  useEffect(() => {
    loadExistingResume();
  }, []);

  const loadExistingResume = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: resumes } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (resumes && resumes.length > 0) {
      const resume = resumes[0];
      setResumeId(resume.id);
      setResumeStatus(resume.status);

      if (resume.status === "parsed") {
        loadSections(resume.id);
      }
    }
  };

  const loadSections = async (rId: string) => {
    const { data } = await supabase
      .from("resume_sections")
      .select("*")
      .eq("resume_id", rId)
      .order("display_order", { ascending: true });

    if (data) setSections(data);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === "application/pdf" || droppedFile.name.endsWith(".docx"))) {
      setFile(droppedFile);
    }
  }, []);

  const handleUploadAndParse = async () => {
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Not authenticated", variant: "destructive" });
      return;
    }

    try {
      setUploading(true);

      // Upload file to storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create resume record
      const { data: resume, error: insertError } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          file_path: filePath,
          file_name: file.name,
          status: "uploaded",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setResumeId(resume.id);
      setResumeStatus("uploaded");
      setUploading(false);

      // Start parsing
      setParsing(true);
      const { data: fnData, error: fnError } = await supabase.functions.invoke("parse-resume", {
        body: { resumeId: resume.id },
      });

      if (fnError) throw fnError;

      if (fnData?.error) {
        throw new Error(fnData.error);
      }

      setResumeStatus("parsed");
      toast({
        title: "Resume parsed!",
        description: `${fnData.sections_count} sections extracted successfully.`,
      });

      // Load sections
      await loadSections(resume.id);
    } catch (error: any) {
      console.error("Upload/parse error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setResumeStatus("error");
    } finally {
      setUploading(false);
      setParsing(false);
    }
  };

  const handleReParse = async () => {
    if (!resumeId) return;
    try {
      setParsing(true);
      const { data: fnData, error: fnError } = await supabase.functions.invoke("parse-resume", {
        body: { resumeId },
      });

      if (fnError) throw fnError;
      if (fnData?.error) throw new Error(fnData.error);

      setResumeStatus("parsed");
      toast({ title: "Re-parsed!", description: `${fnData.sections_count} sections extracted.` });
      await loadSections(resumeId);
    } catch (error: any) {
      toast({ title: "Parse failed", description: error.message, variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems} role="candidate">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">My Resume</h1>
        <p className="text-muted-foreground mb-8">Upload your resume for AI-powered parsing and analysis.</p>

        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-border bg-card"
          }`}
        >
          {uploading || parsing ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 text-primary mb-4 animate-spin" />
              <p className="font-medium text-foreground mb-1">
                {uploading ? "Uploading resume..." : "AI is parsing your resume..."}
              </p>
              <p className="text-sm text-muted-foreground">This may take a moment</p>
            </div>
          ) : file ? (
            <div className="flex flex-col items-center">
              <CheckCircle2 className="h-12 w-12 text-accent mb-4" />
              <p className="font-medium text-foreground mb-1">{file.name}</p>
              <p className="text-sm text-muted-foreground mb-4">{(file.size / 1024).toFixed(1)} KB</p>
              <div className="flex gap-3">
                <Button variant="hero" onClick={handleUploadAndParse}>
                  Upload & Parse with AI
                </Button>
                <Button variant="outline" onClick={() => setFile(null)}>Remove</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="font-medium text-foreground mb-1">Drop your resume here</p>
              <p className="text-sm text-muted-foreground mb-4">PDF or DOCX, up to 10MB</p>
              <label>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                />
                <Button variant="outline" asChild>
                  <span>Browse files</span>
                </Button>
              </label>
            </div>
          )}
        </div>

        {/* Status indicator */}
        {resumeStatus && (
          <div className={`mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm ${
            resumeStatus === "parsed" ? "bg-accent/10 text-accent" :
            resumeStatus === "error" ? "bg-destructive/10 text-destructive" :
            "bg-primary/10 text-primary"
          }`}>
            {resumeStatus === "parsed" && <CheckCircle2 className="h-4 w-4" />}
            {resumeStatus === "error" && <AlertCircle className="h-4 w-4" />}
            {resumeStatus === "parsing" && <Loader2 className="h-4 w-4 animate-spin" />}
            <span className="font-medium">
              {resumeStatus === "parsed" && "Resume parsed successfully"}
              {resumeStatus === "error" && "Parsing failed — try again"}
              {resumeStatus === "uploaded" && "Resume uploaded"}
              {resumeStatus === "parsing" && "Parsing in progress..."}
            </span>
            {resumeStatus === "parsed" && (
              <Button variant="ghost" size="sm" className="ml-auto" onClick={handleReParse} disabled={parsing}>
                Re-parse
              </Button>
            )}
          </div>
        )}

        {/* Parsed sections */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Parsed Sections {sections.length > 0 && `(${sections.length})`}
          </h2>
          {sections.length > 0 ? (
            <ResumeSections sections={sections} />
          ) : (
            <div className="bg-card rounded-xl p-8 shadow-card border border-border text-center">
              <p className="text-muted-foreground text-sm">Upload and parse a resume to see extracted sections here.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResumeUpload;
