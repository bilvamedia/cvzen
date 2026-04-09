import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, User, Briefcase, Check, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoSvg from "@/assets/logo-header.svg";

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
        email, password,
        options: { data: { full_name: fullName, role } },
      });
      if (error) throw error;
      if (data.user) {
        await supabase.from("user_roles").insert({ user_id: data.user.id, role });
        await supabase.from("profiles").insert({ id: data.user.id, full_name: fullName, email, role });
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "welcome-signup",
            recipientEmail: email,
            idempotencyKey: `welcome-${data.user.id}`,
            templateData: { name: fullName, role },
          },
        }).catch(console.error);
        toast({ title: "Account created!", description: "Welcome to cvZen." });
        navigate(role === "recruiter" ? "/recruiter" : "/candidate");
      }
    } catch (error: any) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      value: "candidate" as Role, icon: User, label: "Candidate",
      desc: "Upload your CV, get AI scoring, and find jobs",
      features: ["AI-powered ATS scoring", "Semantic job matching", "Digital profile & sharing"],
    },
    {
      value: "recruiter" as Role, icon: Briefcase, label: "Recruiter",
      desc: "Post jobs, search talent, and schedule interviews",
      features: ["AI job descriptions", "Semantic candidate search", "Interview scheduling"],
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] hero-gradient items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[160px]" />
          <div className="absolute inset-0 grid-bg opacity-30" />
        </div>
        <div className="relative z-10 px-16 max-w-lg">
          <div className="mb-12">
            <img src={logoSvg} alt="cvZen" className="h-12" />
          </div>
          <h2 className="text-4xl font-bold mb-3 tracking-tight" style={{ color: 'hsl(0 0% 98%)' }}>
            Join cvZen
          </h2>
          <p className="text-lg mb-8 leading-relaxed" style={{ color: 'hsl(208 30% 70%)' }}>
            Whether you're seeking your next career move or building your dream team, our AI-powered platform connects talent with opportunity.
          </p>
          <div className="flex items-center gap-2 py-3 px-4 rounded-xl" style={{ background: 'hsl(203 80% 48% / 0.1)', border: '1px solid hsl(203 80% 48% / 0.2)' }}>
            <Sparkles className="h-5 w-5 flex-shrink-0" style={{ color: 'hsl(203 80% 58%)' }} />
            <span className="text-sm" style={{ color: 'hsl(208 30% 78%)' }}>
              Powered by semantic AI — matching goes beyond keywords
            </span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-[440px] py-4">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src={logoSvg} alt="cvZen" className="h-9" />
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Create account</h1>
            <p className="text-muted-foreground">Select your role to get started</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`relative flex flex-col p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  role === r.value
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-muted-foreground/30"
                }`}
              >
                {role === r.value && (
                  <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <r.icon className={`h-5 w-5 mb-2 ${role === r.value ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm font-semibold mb-0.5 ${role === r.value ? "text-foreground" : "text-muted-foreground"}`}>{r.label}</span>
                <span className="text-xs text-muted-foreground leading-tight">{r.desc}</span>
                <div className="mt-3 space-y-1">
                  {r.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className={`h-1 w-1 rounded-full ${role === r.value ? "bg-primary" : "bg-muted-foreground/40"}`} />
                      <span className="text-[10px] text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">Full name</Label>
              <Input id="fullName" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-11 bg-card enterprise-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Work email</Label>
              <Input id="email" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 bg-card enterprise-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-11 bg-card enterprise-border pr-10" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" variant="hero" className="w-full h-11 text-sm font-semibold" disabled={loading}>
              {loading ? "Creating account..." : (
                <span className="flex items-center gap-2">
                  Create {role === "candidate" ? "Candidate" : "Recruiter"} account <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
