import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Mail, Shield, Zap, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoSvg from "@/assets/logo-header.svg";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "Email sent", description: "Check your inbox for the reset link." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
            <p className="text-sm font-medium mt-2 tracking-widest uppercase" style={{ color: 'hsl(208 30% 70%)' }}>
              Intelligent Hiring OS
            </p>
          </div>
          <p className="text-lg mb-10 leading-relaxed" style={{ color: 'hsl(208 30% 70%)' }}>
            Don't worry — resetting your password is quick and secure. You'll be back to your dashboard in no time.
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

          {sent ? (
            <div className="text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
              <p className="text-muted-foreground text-sm">
                We've sent a password reset link to <strong>{email}</strong>. Click the link in the email to reset your password.
              </p>
              <Link to="/login">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Forgot password?</h1>
                <p className="text-muted-foreground">Enter your email and we'll send you a reset link</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                  <Input
                    id="email" type="email" placeholder="name@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="h-11 bg-card enterprise-border"
                  />
                </div>
                <Button type="submit" variant="hero" className="w-full h-11 text-sm font-semibold" disabled={loading}>
                  {loading ? "Sending..." : (
                    <span className="flex items-center gap-2">Send reset link <ArrowRight className="h-4 w-4" /></span>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground text-center">
                  Remember your password?{" "}
                  <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
