import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, Search, Users, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const navItems = [
  { label: "Dashboard", href: "/recruiter", icon: LayoutDashboard },
  { label: "Post Job", href: "/recruiter/post-job", icon: PlusCircle },
  { label: "My Jobs", href: "/recruiter/jobs", icon: FileText },
  { label: "Search Candidates", href: "/recruiter/search", icon: Search },
];

const RecruiterDashboard = () => {
  return (
    <DashboardLayout navItems={navItems} role="recruiter">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Recruiter Dashboard</h1>
        <p className="text-muted-foreground mb-8">Manage jobs and find the best candidates.</p>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Active Jobs", value: "0", color: "text-primary" },
            { label: "Total Candidates", value: "0", color: "text-accent" },
            { label: "Searches Today", value: "0", color: "text-foreground" },
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
                <PlusCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Post a Job</h3>
                <p className="text-xs text-muted-foreground">Create a new listing</p>
              </div>
            </div>
            <Link to="/recruiter/post-job">
              <Button variant="hero" size="sm" className="w-full">Create Job</Button>
            </Link>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Find Candidates</h3>
                <p className="text-xs text-muted-foreground">Semantic search</p>
              </div>
            </div>
            <Link to="/recruiter/search">
              <Button variant="accent" size="sm" className="w-full">Search</Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RecruiterDashboard;
