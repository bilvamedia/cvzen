import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, User, Search, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { label: "Dashboard", href: "/candidate", icon: LayoutDashboard },
  { label: "My Resume", href: "/candidate/resume", icon: FileText },
  { label: "Digital Profile", href: "/candidate/profile", icon: User },
  { label: "Search Jobs", href: "/candidate/search", icon: Search },
];

const CandidateProfile = () => {
  const { toast } = useToast();

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied!", description: "Share this link with recruiters." });
  };

  return (
    <DashboardLayout navItems={navItems} role="candidate">
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Digital Profile</h1>
            <p className="text-muted-foreground">Your AI-generated professional profile.</p>
          </div>
          <Button variant="hero" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1" /> Share
          </Button>
        </div>

        <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          <div className="h-24 hero-gradient" />
          <div className="px-6 pb-6">
            <div className="h-16 w-16 rounded-full bg-secondary border-4 border-card -mt-8 flex items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mt-3">Your Name</h2>
            <p className="text-sm text-muted-foreground">Complete your resume to populate your profile</p>
          </div>

          <div className="border-t border-border px-6 py-6 space-y-6">
            {["Summary", "Experience", "Education", "Skills", "Projects"].map((section) => (
              <div key={section}>
                <h3 className="text-sm font-semibold text-foreground mb-2">{section}</h3>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">No data yet. Upload your resume to populate.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CandidateProfile;
