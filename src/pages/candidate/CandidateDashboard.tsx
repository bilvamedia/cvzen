import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, User, Search, Share2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const navItems = [
  { label: "Dashboard", href: "/candidate", icon: LayoutDashboard },
  { label: "My Resume", href: "/candidate/resume", icon: FileText },
  { label: "Digital Profile", href: "/candidate/profile", icon: User },
  { label: "ATS Score", href: "/candidate/ats-score", icon: Target },
  { label: "Search Jobs", href: "/candidate/search", icon: Search },
];

const CandidateDashboard = () => {
  return (
    <DashboardLayout navItems={navItems} role="candidate">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back 👋</h1>
        <p className="text-muted-foreground mb-8">Here's your overview.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Profile Completeness", value: "0%", color: "text-primary" },
            { label: "Resume Sections", value: "0", color: "text-accent" },
            { label: "Profile Views", value: "0", color: "text-foreground" },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-xl p-5 shadow-card border border-border">
              <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Upload Resume</h3>
                <p className="text-xs text-muted-foreground">Get AI-powered analysis</p>
              </div>
            </div>
            <Link to="/candidate/resume">
              <Button variant="hero" size="sm" className="w-full">Upload & Parse</Button>
            </Link>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Share2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Share Profile</h3>
                <p className="text-xs text-muted-foreground">Create your digital profile</p>
              </div>
            </div>
            <Link to="/candidate/profile">
              <Button variant="accent" size="sm" className="w-full">View Profile</Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CandidateDashboard;
