import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, User, Briefcase, Check, ArrowRight, Sparkles, ArrowLeft, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          data: { full_name: fullName, role },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      if (data.user) {
        // Insert role and profile immediately (they'll be ready when the user verifies)
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

        // Show verification message
        setEmailSent(true);
      }
    } catch (error: any) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        toast({ title: "Google sign-up failed", description: String(result.error), variant: "destructive" });
        return;
      }

      if (result.redirected) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
        if (!existingProfile) {
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "";
          await supabase.from("profiles").insert({ id: user.id, full_name: fullName, email: user.email, role });
          await supabase.from("user_roles").insert({ user_id: user.id, role });
        }
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
        const userRole = roles?.[0]?.role;
        navigate(userRole === "recruiter" ? "/recruiter" : "/candidate");
      }
    } catch (error: any) {
      toast({ title: "Google sign-up failed", description: error.message, variant: "destructive" });
    } finally {
      setGoogleLoading(false);
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

  // Email verification confirmation screen
  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] text-center">
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3 tracking-tight">Check your email</h1>
          <p className="text-muted-foreground mb-2">
            We've sent a verification link to
          </p>
          <p className="text-foreground font-semibold mb-6">{email}</p>
          <p className="text-sm text-muted-foreground mb-8">
            Click the link in the email to verify your account and get started. If you don't see it, check your spam folder.
          </p>
          <div className="space-y-3">
            <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
              Go to Sign in
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setEmailSent(false)}
            >
              Use a different email
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            <p className="text-sm font-medium mt-2 tracking-widest uppercase" style={{ color: 'hsl(208 30% 70%)' }}>
              Intelligent Hiring OS
            </p>
          </div>
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
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 overflow-y-auto relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Home
        </Button>
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

          {/* Google Sign Up */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 mb-5 enterprise-border font-medium"
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {googleLoading ? "Signing up..." : "Continue with Google"}
          </Button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">Full name</Label>
              <Input id="fullName" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-11 bg-card enterprise-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">{role === "recruiter" ? "Work email" : "Email"}</Label>
              <Input id="email" type="email" placeholder={role === "recruiter" ? "name@company.com" : "name@example.com"} value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 bg-card enterprise-border" />
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
