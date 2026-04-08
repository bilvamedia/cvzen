import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, User, Search, Sparkles, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", href: "/candidate", icon: LayoutDashboard },
  { label: "My CV", href: "/candidate/resume", icon: FileText },
  { label: "Digital Profile", href: "/candidate/profile", icon: User },
  { label: "ATS Score", href: "/candidate/ats-score", icon: Target },
  { label: "Search Jobs", href: "/candidate/search", icon: Search },
];

const JobSearch = () => {
  const [query, setQuery] = useState("");

  return (
    <DashboardLayout navItems={navItems} role="candidate">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Semantic Job Search</h1>
        <p className="text-muted-foreground mb-8">Describe what you're looking for — we'll find jobs that match the meaning, not just keywords.</p>

        <div className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="e.g. 'backend role with distributed systems at a startup'"
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
          <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Enter a search query to find semantically matching jobs.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobSearch;
