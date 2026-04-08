import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, Search, PlusCircle, Sparkles, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", href: "/recruiter", icon: LayoutDashboard },
  { label: "Post Job", href: "/recruiter/post-job", icon: PlusCircle },
  { label: "My Jobs", href: "/recruiter/jobs", icon: FileText },
  { label: "Search Candidates", href: "/recruiter/search", icon: Search },
];

const CandidateSearch = () => {
  const [query, setQuery] = useState("");

  return (
    <DashboardLayout navItems={navItems} role="recruiter">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Semantic Candidate Search</h1>
        <p className="text-muted-foreground mb-8">Describe the ideal candidate — we'll search CVs by meaning.</p>

        <div className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="e.g. 'ML engineer with production experience in NLP and Python'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="hero">
            <Sparkles className="h-4 w-4 mr-1" /> Search
          </Button>
        </div>

        <div className="bg-card rounded-xl p-12 shadow-card border border-border text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Enter a query to find semantically matching candidates.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CandidateSearch;
