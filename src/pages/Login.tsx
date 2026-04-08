import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, Shield, Zap, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoSvg from "@/assets/logo.svg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
        const role = roles?.[0]?.role;
        navigate(role === "recruiter" ? "/recruiter" : "/candidate");
      }
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
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
          </div>
          <h2 className="text-4xl font-bold mb-3 tracking-tight" style={{ color: 'hsl(0 0% 98%)' }}>
            Welcome back
          </h2>
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
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <img src={logoSvg} alt="cvZen" className="h-9" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Sign in</h1>
            <p className="text-muted-foreground">Enter your credentials to access your account</p>
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

          <div className="mt-8 pt-6 border-t border-border">
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
