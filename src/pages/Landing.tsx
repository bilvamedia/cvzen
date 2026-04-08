import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Users, Sparkles, ArrowRight, Shield, Zap, Brain } from "lucide-react";
import logoFull from "@/assets/logo-full.jpg";
import logoMain from "@/assets/logo-main.svg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2">
            <img src={logoMain} alt="cvZen — Intelligent Hiring OS" className="h-10 w-auto" />
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button variant="hero" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-gradient pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent rounded-full blur-[150px]" />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-8">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Intelligent Hiring OS</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6" style={{ color: 'hsl(0 0% 98%)' }}>
              Find talent by
              <span className="text-gradient"> meaning</span>,
              <br />not just keywords
            </h1>
            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: 'hsl(216 20% 75%)' }}>
              Upload resumes, parse with AI, create digital profiles, and search semantically.
              Connect the right candidates with the right roles — intelligently.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup?role=candidate">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  I'm a Candidate <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link to="/signup?role=recruiter">
                <Button size="lg" className="w-full sm:w-auto border-2 font-semibold transition-all duration-300" style={{ borderColor: 'hsl(0 0% 100% / 0.15)', color: 'hsl(0 0% 95%)', background: 'transparent' }}>
                  I'm a Recruiter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">How it works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A smarter way to connect talent with opportunity using AI and semantic understanding.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: FileText, title: "Upload Resume", desc: "Upload your resume and let AI parse every section automatically." },
              { icon: Brain, title: "AI Analysis", desc: "Get detailed analysis with skills extraction and experience mapping." },
              { icon: Users, title: "Digital Profile", desc: "Share a rich digital profile with recruiters — no more PDF attachments." },
              { icon: Zap, title: "Semantic Search", desc: "Search by meaning. Find roles or candidates that truly match." },
            ].map((f, i) => (
              <div key={i} className="bg-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-shadow duration-300 border border-border">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 mb-6">
            <Shield className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-medium text-accent">Secure & Private</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to transform your hiring?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Join thousands of candidates and recruiters using semantic intelligence.
          </p>
          <Link to="/signup">
            <Button variant="hero" size="lg">
              Start Free <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">© 2026 cvZen. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <img src={logoMain} alt="cvZen" className="h-5 w-auto" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
