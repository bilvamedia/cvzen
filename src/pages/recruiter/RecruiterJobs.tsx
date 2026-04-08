import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, Search, PlusCircle, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const navItems = [
  { label: "Dashboard", href: "/recruiter", icon: LayoutDashboard },
  { label: "Post Job", href: "/recruiter/post-job", icon: PlusCircle },
  { label: "My Jobs", href: "/recruiter/jobs", icon: FileText },
  { label: "Search Candidates", href: "/recruiter/search", icon: Search },
];

const RecruiterJobs = () => {
  return (
    <DashboardLayout navItems={navItems} role="recruiter">
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">My Jobs</h1>
            <p className="text-muted-foreground">Manage your posted job listings.</p>
          </div>
          <Link to="/recruiter/post-job">
            <Button variant="hero" size="sm">
              <PlusCircle className="h-4 w-4 mr-1" /> New Job
            </Button>
          </Link>
        </div>

        <div className="bg-card rounded-xl p-12 shadow-card border border-border text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No jobs posted yet. Create your first job listing.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RecruiterJobs;
