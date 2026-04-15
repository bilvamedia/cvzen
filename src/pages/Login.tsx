import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, Shield, Zap, Brain, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import logoSvg from "@/assets/logo-header.svg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const redirectByRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const role = roles?.[0]?.role;
      navigate(role === "recruiter" ? "/recruiter" : "/candidate");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await redirectByRole();
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        toast({ title: "Google sign-in failed", description: String(result.error), variant: "destructive" });
        return;
      }

      if (result.redirected) return;

      // User authenticated — check if profile exists, create if needed
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
        if (!existingProfile) {
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "";
          await supabase.from("profiles").insert({ id: user.id, full_name: fullName, email: user.email, role: "candidate" });
          await supabase.from("user_roles").insert({ user_id: user.id, role: "candidate" as const });
        }
        await redirectByRole();
      }
    } catch (error: any) {
      toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  const features = [
    { icon: Brain, text: "AI-powered semantic matching" },
    { icon: Zap, text: "Instant ATS scoring & optimization" },
    { icon: Shield, text: "Enterprise-grade data privacy" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] hero-gradient items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[160px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[120px]" />
          <div className="absolute inset-0 grid-bg opacity-30" />
        </div>
        <div className="relative z-10 px-16 max-w-lg">
          <div className="mb-12">
            <img src={logoSvg} alt="cvZen" className="h-12" />
            <p className="text-sm font-medium mt-2 tracking-widest uppercase" style={{ color: 'hsl(208 30% 70%)' }}>
              Intelligent Hiring OS
            </p>
          </div>
          <p className="text-lg mb-10 leading-relaxed" style={{ color: 'hsl(208 30% 70%)' }}>
            Your intelligent hiring platform awaits. Access your dashboard to manage profiles, discover opportunities, and leverage AI-powered insights.
          </p>
          <div className="space-y-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'hsl(203 80% 48% / 0.15)' }}>
                  <f.icon className="h-4.5 w-4.5" style={{ color: 'hsl(203 80% 58%)' }} />
                </div>
                <span className="text-sm font-medium" style={{ color: 'hsl(208 30% 78%)' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Home
        </Button>
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <img src={logoSvg} alt="cvZen" className="h-9" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Sign in</h1>
            <p className="text-muted-foreground">Enter your credentials to access your account</p>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 mb-6 enterprise-border font-medium"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input
                id="email" type="email" placeholder="name@company.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required
                className="h-11 bg-card enterprise-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password" type={showPassword ? "text" : "password"}
                  placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} required
                  className="h-11 bg-card enterprise-border pr-10"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" variant="hero" className="w-full h-11 text-sm font-semibold" disabled={loading}>
              {loading ? "Signing in..." : (
                <span className="flex items-center gap-2">Sign in <ArrowRight className="h-4 w-4" /></span>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Forgot your password?
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-semibold hover:underline">Create account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
