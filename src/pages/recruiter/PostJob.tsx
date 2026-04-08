import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, Search, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { label: "Dashboard", href: "/recruiter", icon: LayoutDashboard },
  { label: "Post Job", href: "/recruiter/post-job", icon: PlusCircle },
  { label: "My Jobs", href: "/recruiter/jobs", icon: FileText },
  { label: "Search Candidates", href: "/recruiter/search", icon: Search },
];

const PostJob = () => {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: save to DB + generate embeddings
    setTimeout(() => {
      toast({ title: "Job posted!", description: "Your job listing is now searchable." });
      setLoading(false);
      setTitle(""); setCompany(""); setLocation(""); setDescription("");
    }, 1000);
  };

  return (
    <DashboardLayout navItems={navItems} role="recruiter">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Post a Job</h1>
        <p className="text-muted-foreground mb-8">Create a job listing. The description will be stored as embeddings for semantic search.</p>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl p-6 shadow-card border border-border">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input id="title" placeholder="Senior Backend Engineer" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Acme Inc." value={company} onChange={(e) => setCompany(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="Remote / San Francisco, CA" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Job Description</Label>
            <Textarea id="description" placeholder="Describe the role, responsibilities, requirements, and tech stack..." value={description} onChange={(e) => setDescription(e.target.value)} rows={8} required />
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={loading}>
            {loading ? "Publishing..." : "Publish Job"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default PostJob;
