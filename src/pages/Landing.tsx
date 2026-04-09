import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  FileText, Users, Sparkles, ArrowRight, Shield, Zap, Brain,
  ChevronRight, Check, BarChart3, Search, Globe, Lock, TrendingUp,
  Award, Target, Layers
} from "lucide-react";
import logoHeader from "@/assets/logo-header.svg";
import heroBg from "@/assets/hero-bg.jpg";
import { useEffect, useRef, useState } from "react";
import { SemanticHeroBackground } from "@/components/SemanticHeroBackground";

/* ── Intersection Observer hook for scroll-triggered animations ── */
const useInView = (options?: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.15, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
};

/* ── Animated counter ── */
const Counter = ({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);
  return <span ref={ref} className="tabular-nums">{count.toLocaleString()}{suffix}</span>;
};

const FEATURES = [
  { icon: Brain, title: "AI-Powered Parsing", desc: "Intelligent extraction of skills, experience, and qualifications from any CV format with 98% accuracy.", tag: "NLP Engine" },
  { icon: Search, title: "Semantic Search", desc: "Go beyond keyword matching. Find candidates by meaning, context, and intent — powered by vector embeddings.", tag: "Vector Search" },
  { icon: BarChart3, title: "ATS Scoring", desc: "Section-by-section CV scoring with actionable improvement suggestions aligned to industry standards.", tag: "Analytics" },
  { icon: Globe, title: "Digital Profiles", desc: "Transform static CVs into rich, shareable digital profiles that recruiters can discover and evaluate.", tag: "Profiles" },
  { icon: Target, title: "Smart Matching", desc: "Connect the right talent to the right roles using multi-dimensional compatibility scoring.", tag: "Matching" },
  { icon: Shield, title: "Enterprise Security", desc: "SOC 2 compliant infrastructure with role-based access, audit trails, and end-to-end encryption.", tag: "Security" },
];

const STATS = [
  { value: 98, suffix: "%", label: "Parsing Accuracy" },
  { value: 3, suffix: "x", label: "Faster Screening" },
  { value: 10000, suffix: "+", label: "CVs Processed" },
  { value: 85, suffix: "%", label: "Recruiter Time Saved" },
];

const WORKFLOW = [
  { step: "01", title: "Upload", desc: "Candidates upload CVs in any format. Our AI parses and structures every section.", icon: FileText },
  { step: "02", title: "Analyze", desc: "AI scores each section, identifies keywords, and generates improvement suggestions.", icon: Brain },
  { step: "03", title: "Profile", desc: "A rich digital profile is auto-generated — shareable, searchable, and always up to date.", icon: Users },
  { step: "04", title: "Connect", desc: "Recruiters search semantically, finding talent by meaning — not just matching keywords.", icon: Zap },
];

const Landing = () => {
  const hero = useInView();
  const features = useInView();
  const workflow = useInView();
  const stats = useInView();
  const cta = useInView();

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background" role="main">
      {/* ──────────── NAV ──────────── */}
      <nav
        className="fixed top-0 w-full z-50 border-b border-white/[0.08]"
        style={{ background: 'hsl(240 55% 16%)' }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2 focus-ring rounded-md" aria-label="cvZen Home">
            <img src={logoHeader} alt="cvZen — Intelligent Hiring OS" className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/pricing">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 focus-ring transition-colors duration-200">
                Pricing
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 focus-ring transition-colors duration-200">
                Sign in
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/85 focus-ring font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group">
                Get Started
                <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ──────────── HERO ──────────── */}
      <section ref={hero.ref} className="pt-28 pb-24 md:pt-36 md:pb-32 relative overflow-hidden bg-white">
        <SemanticHeroBackground />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Status badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-8 opacity-0 ${hero.inView ? 'animate-fade-in' : ''}`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-xs font-semibold tracking-wide text-primary uppercase">Intelligent Hiring OS</span>
            </div>

            <h1
              className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.08] opacity-0 ${hero.inView ? 'animate-fade-in stagger-1' : ''}`}
              style={{ color: 'hsl(240 55% 13%)' }}
            >
              Find talent by{" "}
              <span className="text-gradient">meaning</span>,
              <br className="hidden sm:block" />
              not just keywords
            </h1>

            <p
              className={`text-base sm:text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed opacity-0 ${hero.inView ? 'animate-fade-in stagger-2' : ''}`}
              style={{ color: 'hsl(240 10% 40%)' }}
            >
              Upload CVs, parse with AI, create digital profiles, and search semantically.
              Connect the right candidates with the right roles — intelligently.
            </p>

            <div className={`flex flex-col sm:flex-row gap-4 justify-center opacity-0 ${hero.inView ? 'animate-fade-in stagger-3' : ''}`}>
              <Link to="/signup?role=candidate">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/85 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-base h-12 px-8 group focus-ring">
                  I'm a Candidate
                  <ArrowRight className="h-4 w-4 ml-1.5 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/signup?role=recruiter">
                <Button size="lg" className="w-full sm:w-auto border-2 border-primary/40 hover:bg-primary/10 hover:border-primary/60 h-12 px-8 font-semibold text-base transition-all duration-300 focus-ring group"
                  style={{ color: 'hsl(240 55% 13%)' }}
                >
                  I'm a Recruiter
                  <ChevronRight className="h-4 w-4 ml-1 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>

            {/* Trust signals */}
            <div className={`mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 opacity-0 ${hero.inView ? 'animate-fade-in stagger-4' : ''}`}>
              {["ATS Compatible", "GDPR Ready", "SOC 2 Compliant", "256-bit Encryption"].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'hsl(208 30% 60%)' }}>
                  <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── STATS BAR ──────────── */}
      <section ref={stats.ref} className="bg-card border-y border-border py-10" aria-label="Key metrics">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <div key={s.label} className={`text-center opacity-0 ${stats.inView ? `animate-fade-in stagger-${i + 1}` : ''}`}>
                <div className="text-3xl md:text-4xl font-extrabold text-primary mb-1">
                  <Counter end={s.value} suffix={s.suffix} />
                </div>
                <div className="text-sm font-medium text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── WORKFLOW ──────────── */}
      <section ref={workflow.ref} className="py-20 md:py-28 bg-background relative" aria-label="How it works">
        <div className="container mx-auto px-6">
          <div className={`text-center mb-16 opacity-0 ${workflow.inView ? 'animate-fade-in' : ''}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/15 bg-primary/5 mb-4">
              <Layers className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-semibold tracking-widest text-primary uppercase">Workflow</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How it works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base">
              A streamlined pipeline from upload to hire — powered by AI at every step.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {WORKFLOW.map((w, i) => (
              <div
                key={w.step}
                className={`relative bg-card rounded-xl p-6 enterprise-border hover-lift group opacity-0 ${workflow.inView ? `animate-fade-in stagger-${i + 1}` : ''}`}
              >
                {/* Step connector line */}
                {i < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-px bg-border" aria-hidden="true" />
                )}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-bold tracking-widest text-primary/40 uppercase">{w.step}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/8 flex items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-primary/15">
                  <w.icon className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{w.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── FEATURES ──────────── */}
      <section ref={features.ref} className="py-20 md:py-28 bg-secondary/30 grid-bg relative" aria-label="Platform capabilities">
        <div className="container mx-auto px-6">
          <div className={`text-center mb-16 opacity-0 ${features.inView ? 'animate-fade-in' : ''}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/15 bg-primary/5 mb-4">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-semibold tracking-widest text-primary uppercase">Capabilities</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Enterprise-grade intelligence</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base">
              Purpose-built for modern hiring teams that demand accuracy, speed, and security.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`bg-card rounded-xl p-6 enterprise-border hover-lift group opacity-0 ${features.inView ? `animate-fade-in stagger-${i + 1}` : ''}`}
                role="article"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-11 w-11 rounded-lg bg-primary/8 flex items-center justify-center transition-colors duration-300 group-hover:bg-primary/15">
                    <f.icon className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase px-2 py-0.5 rounded-full border border-border bg-muted/50">
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── DUAL CTA ──────────── */}
      <section className="py-20 md:py-28 bg-background" aria-label="Choose your role">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Candidate CTA */}
            <div className="bg-card rounded-xl p-8 enterprise-border hover-lift group">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 transition-colors duration-300 group-hover:bg-primary/15">
                <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">For Candidates</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Upload your CV, get AI-powered insights, build a digital profile, and improve your ATS score section by section.
              </p>
              <ul className="space-y-2 mb-6" aria-label="Candidate benefits">
                {["AI CV parsing", "Section-wise ATS scoring", "Digital profile builder", "CV improvement suggestions"].map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-foreground/80">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
              <Link to="/signup?role=candidate">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/85 font-semibold transition-all duration-300 group/btn focus-ring">
                  Get Started Free
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                </Button>
              </Link>
            </div>

            {/* Recruiter CTA */}
            <div className="bg-accent rounded-xl p-8 border border-accent/80 hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 grid-bg opacity-20" aria-hidden="true" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center transition-colors duration-300 group-hover:bg-white/15">
                    <Users className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-primary uppercase px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10">
                    Enterprise
                  </span>
                </div>
                <h3 className="text-xl font-bold text-accent-foreground mb-2">For Recruiters</h3>
                <p className="text-sm text-accent-foreground/70 mb-6 leading-relaxed">
                  Search candidates semantically, evaluate digital profiles, post jobs, and build talent pipelines with AI-powered precision.
                </p>
                <ul className="space-y-2 mb-6" aria-label="Recruiter benefits">
                  {["Semantic candidate search", "AI-matched talent pools", "Job posting & management", "Compliance & audit trails"].map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-accent-foreground/80">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link to="/signup?role=recruiter">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/85 font-semibold transition-all duration-300 group/btn focus-ring">
                    Request Demo
                    <ArrowRight className="h-4 w-4 ml-1 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── FINAL CTA ──────────── */}
      <section ref={cta.ref} className="py-20 md:py-28 relative overflow-hidden" aria-label="Call to action">
        <img src={heroBg} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" loading="lazy" width={1920} height={1080} />
        <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className={`max-w-2xl mx-auto opacity-0 ${cta.inView ? 'animate-fade-in' : ''}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-6">
              <Award className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span className="text-xs font-semibold text-primary">Trusted by Enterprise Teams</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'hsl(0 0% 98%)' }}>
              Ready to transform your hiring?
            </h2>
            <p className="text-base mb-8 max-w-lg mx-auto" style={{ color: 'hsl(208 30% 70%)' }}>
              Join organizations using semantic intelligence to hire smarter, faster, and more fairly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/85 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold h-12 px-8 focus-ring group">
                  Start Free
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" className="bg-transparent border-2 border-white/20 text-white hover:bg-white/5 hover:border-white/30 h-12 px-8 font-semibold transition-all duration-300 focus-ring">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── FOOTER ──────────── */}
      <footer className="py-8 border-t border-white/[0.08]" style={{ background: 'hsl(240 55% 16%)' }} role="contentinfo">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={logoHeader} alt="cvZen" className="h-6 w-auto opacity-80" />
            <span className="text-sm text-white/50">© {new Date().getFullYear()} cvZen. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Disclaimer", href: "/disclaimer" },
              { label: "Brand", href: "/brand" },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-xs font-medium text-white/50 hover:text-white transition-colors duration-200 focus-ring rounded-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
