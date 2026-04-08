import { useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, User, Search, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", href: "/candidate", icon: LayoutDashboard },
  { label: "My Resume", href: "/candidate/resume", icon: FileText },
  { label: "Digital Profile", href: "/candidate/profile", icon: User },
  { label: "Search Jobs", href: "/candidate/search", icon: Search },
];

const ResumeUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === "application/pdf" || droppedFile.name.endsWith(".docx"))) {
      setFile(droppedFile);
    }
  }, []);

  return (
    <DashboardLayout navItems={navItems} role="candidate">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">My Resume</h1>
        <p className="text-muted-foreground mb-8">Upload your resume for AI-powered parsing and analysis.</p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-border bg-card"
          }`}
        >
          {file ? (
            <div className="flex flex-col items-center">
              <CheckCircle2 className="h-12 w-12 text-accent mb-4" />
              <p className="font-medium text-foreground mb-1">{file.name}</p>
              <p className="text-sm text-muted-foreground mb-4">{(file.size / 1024).toFixed(1)} KB</p>
              <div className="flex gap-3">
                <Button variant="hero" onClick={() => { /* TODO: parse */ }}>
                  Parse with AI
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

        {/* Parsed sections placeholder */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Parsed Sections</h2>
          <div className="bg-card rounded-xl p-8 shadow-card border border-border text-center">
            <p className="text-muted-foreground text-sm">Upload and parse a resume to see extracted sections here.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResumeUpload;
