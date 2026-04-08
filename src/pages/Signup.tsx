import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Eye, EyeOff, User, Briefcase, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Role = "candidate" | "recruiter";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>((searchParams.get("role") as Role) || "candidate");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      });
      if (error) throw error;
      if (data.user) {
        // Insert role
        await supabase.from("user_roles").insert({ user_id: data.user.id, role });
        // Insert profile
        await supabase.from("profiles").insert({ id: data.user.id, full_name: fullName, email, role });
        toast({ title: "Account created!", description: "Welcome to TalentLens." });
        navigate(role === "recruiter" ? "/recruiter" : "/candidate");
      }
    } catch (error: any) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 hero-gradient items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent rounded-full blur-[150px]" />
        </div>
        <div className="relative z-10 px-12 max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Search className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold" style={{ color: 'hsl(0 0% 98%)' }}>TalentLens</span>
          </div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'hsl(0 0% 98%)' }}>
            Join TalentLens
          </h2>
          <p style={{ color: 'hsl(210 15% 75%)' }}>
            Whether you're looking for your next role or your next hire, TalentLens uses AI to make the connection meaningful.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Search className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">TalentLens</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1">Create account</h1>
          <p className="text-sm text-muted-foreground mb-6">Choose your role and get started</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {([
              { value: "candidate" as Role, icon: User, label: "Candidate", desc: "Find jobs" },
              { value: "recruiter" as Role, icon: Briefcase, label: "Recruiter", desc: "Find talent" },
            ]).map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${
                  role === r.value
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-muted-foreground/30"
                }`}
              >
                {role === r.value && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <r.icon className={`h-6 w-6 mb-2 ${role === r.value ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm font-medium ${role === r.value ? "text-foreground" : "text-muted-foreground"}`}>{r.label}</span>
                <span className="text-xs text-muted-foreground">{r.desc}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : `Sign up as ${role === "candidate" ? "Candidate" : "Recruiter"}`}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
