import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  FileText, Users, Sparkles, ArrowRight, Shield, Zap, Brain,
  ChevronRight, Check, BarChart3, Search, Globe, TrendingUp,
  Award, Target, Layers, Quote, Star, MessageSquare, Upload,
  CheckCircle2, Briefcase, Lightbulb, Rocket
} from "lucide-react";
import logoHeader from "@/assets/logo-header.svg";
import { useEffect, useRef, useState } from "react";

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

const STATS = [
  { value: 10000, suffix: "+", label: "CVs Parsed", desc: "Across roles, industries, and seniority levels — structured and searchable in seconds." },
  { value: 40, suffix: "+", label: "Semantic Dimensions", desc: "Multi-vector matching that understands skills, intent, context, and career trajectory." },
  { value: 63, suffix: "%", label: "Faster Time-to-Hire", desc: "Recruiters using semantic search shortlist qualified candidates in a fraction of the time." },
];

const TESTIMONIALS = [
  { quote: "We replaced three screening tools with cvZen. Our recruiters now spend time on conversations, not keyword games.", author: "Priya N.", role: "Head of Talent" },
  { quote: "The semantic search actually understands what I mean. I described the role and got the right candidates — no boolean gymnastics.", author: "Marcus L.", role: "Tech Recruiter" },
  { quote: "Uploaded my CV and within minutes I had a shareable digital profile and concrete suggestions to improve my ATS score.", author: "Anika R.", role: "Product Designer" },
];

const CV_PROBLEMS = [
  { title: "Static & Outdated", desc: "PDFs go stale the moment you save them. Profiles update themselves." },
  { title: "Hard to Search", desc: "Keyword search misses context. Semantic search finds intent, not just text." },
  { title: "One-Size-Fits-All", desc: "A single PDF can't speak to every role. Profiles adapt their narrative." },
];

const CANDIDATE_FEATURES = [
  { icon: Upload, title: "Upload any CV", desc: "PDF or DOCX — our AI parses every section into structured data." },
  { icon: BarChart3, title: "ATS Scoring", desc: "Item-level scoring and feedback so you know exactly what to improve." },
  { icon: Sparkles, title: "AI Enhancement", desc: "Refine bullet points, summaries, and bios non-destructively." },
  { icon: Globe, title: "Digital Profile", desc: "A clean, shareable profile at /yourname — recruiters find you here." },
  { icon: Briefcase, title: "Job Matching", desc: "Semantic matching against roles based on what you've actually done." },
];

const RECRUITER_FEATURES = [
  { icon: Search, title: "Semantic Candidate Search", desc: "Describe who you need in plain English. Get ranked, relevant matches." },
  { icon: Brain, title: "AI Job Posts", desc: "Generate descriptions, embeddings, and shareable public job pages instantly." },
  { icon: Target, title: "Shortlisting & Notes", desc: "Save, annotate, and revisit candidates across your hiring pipeline." },
  { icon: MessageSquare, title: "Interview Scheduling", desc: "Fixed-time or slot-based, with calendar invites generated automatically." },
  { icon: Shield, title: "Compliance Built-In", desc: "Role-based access, audit trails, GDPR/DPDP-aligned data handling." },
];

const STEPS_CANDIDATE = [
  { icon: Upload, title: "Upload your CV", desc: "Drop your PDF or DOCX. AI parses every section into structured data in seconds." },
  { icon: Sparkles, title: "Improve & enhance", desc: "Item-level ATS scoring with AI suggestions you can accept or refine." },
  { icon: Globe, title: "Share your profile", desc: "Get a public profile URL recruiters can discover via semantic search." },
];

const STEPS_RECRUITER = [
  { icon: Briefcase, title: "Post a role", desc: "AI helps draft the description and generates embeddings for matching." },
  { icon: Search, title: "Search semantically", desc: "Describe the candidate you need. We rank profiles by meaning, not keywords." },
  { icon: CheckCircle2, title: "Shortlist & schedule", desc: "Save candidates, send interview invites, and track applications end-to-end." },
];

const PRICING_PREVIEW = [
  { name: "Free", price: "$0", period: "forever", desc: "Get started — no card required.", features: ["1 active CV", "ATS scoring", "Public profile", "Basic job search"], cta: "Get Started Free", highlight: false },
  { name: "Pro", price: "$9", period: "/ month", desc: "For serious job seekers.", features: ["Unlimited CV revisions", "AI enhancement", "Priority matching", "Advanced ATS insights"], cta: "Start Pro Trial", highlight: true },
  { name: "Recruiter", price: "$49", period: "/ month", desc: "For hiring teams.", features: ["Semantic candidate search", "Unlimited job posts", "Shortlisting & notes", "Interview scheduling"], cta: "Try Recruiter", highlight: false },
];

const INSIGHTS = [
  { tag: "Career", title: "How to write a CV that actually passes ATS in 2026", desc: "The rules have changed. Here's what modern parsers look for — and what they quietly reject." },
  { tag: "Hiring", title: "Beyond keyword search: why semantic matching wins", desc: "How vector embeddings let you find candidates by meaning, intent, and context — not exact text." },
  { tag: "Product", title: "From PDF to profile: the death of the static CV", desc: "Why a living, shareable digital profile beats a PDF in every measurable hiring metric." },
];

const Landing = () => {
  const hero = useInView();
  const stats = useInView();
  const semantic = useInView();
  const pdfDeath = useInView();
  const features = useInView();
  const steps = useInView();
  const pricing = useInView();
  const insights = useInView();
  const cta = useInView();

  return (
    <div className="min-h-screen bg-[hsl(240_55%_8%)] text-white" role="main">
      {/* ──────────── NAV ──────────── */}
      <nav
        className="fixed top-0 w-full z-50 border-b border-white/[0.06] backdrop-blur-md"
        style={{ background: 'hsl(240 55% 10% / 0.85)' }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2 focus-ring rounded-md" aria-label="cvZen Home">
            <img src={logoHeader} alt="cvZen — Intelligent Hiring OS" className="h-9 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <a href="#features" className="px-3 py-2 text-sm text-white/70 hover:text-white transition-colors">Features</a>
            <a href="#how" className="px-3 py-2 text-sm text-white/70 hover:text-white transition-colors">How it works</a>
            <Link to="/pricing" className="px-3 py-2 text-sm text-white/70 hover:text-white transition-colors">Pricing</Link>
            <a href="#insights" className="px-3 py-2 text-sm text-white/70 hover:text-white transition-colors">Insights</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 focus-ring">
                Sign in
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/85 focus-ring font-semibold shadow-lg group">
                Build Free CV
                <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ──────────── HERO ──────────── */}
      <section ref={hero.ref} className="pt-32 pb-20 md:pt-40 md:pb-24 relative overflow-hidden">
        {/* Ambient glow */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-20"
            style={{ background: 'radial-gradient(circle, hsl(202 75% 50% / 0.6), transparent 60%)' }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 mb-8 opacity-0 ${hero.inView ? 'animate-fade-in' : ''}`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-xs font-semibold tracking-wider text-primary uppercase">Now in Public Beta</span>
            </div>

            <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05] opacity-0 ${hero.inView ? 'animate-fade-in stagger-1' : ''}`}>
              The World's First
              <br />
              <span className="bg-gradient-to-r from-[hsl(202_85%_60%)] via-[hsl(210_90%_70%)] to-[hsl(220_85%_75%)] bg-clip-text text-transparent">
                Paperless Hiring Platform.
              </span>
            </h1>

            <p className={`text-base sm:text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed text-white/65 opacity-0 ${hero.inView ? 'animate-fade-in stagger-2' : ''}`}>
              Replace PDFs with living digital profiles. Recruiters search by meaning,
              candidates get matched by intent. No PDFs. No keyword games. Just hiring.
            </p>

            <div className={`flex flex-col sm:flex-row gap-3 justify-center opacity-0 ${hero.inView ? 'animate-fade-in stagger-3' : ''}`}>
              <Link to="/signup?role=candidate">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/30 font-semibold text-base h-12 px-8 group focus-ring">
                  Build Your Free CV
                  <ArrowRight className="h-4 w-4 ml-1.5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/signup?role=recruiter">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/[0.04] border-white/15 text-white hover:bg-white/10 hover:border-white/25 h-12 px-8 font-semibold text-base focus-ring">
                  See it for Recruiters
                </Button>
              </Link>
            </div>

            <div className={`mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/50 opacity-0 ${hero.inView ? 'animate-fade-in stagger-4' : ''}`}>
              {["No credit card", "Cancel anytime", "GDPR & DPDP ready"].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {t}
                </div>
              ))}
            </div>

            {/* Mock terminal / search bar */}
            <div className={`mt-14 max-w-3xl mx-auto opacity-0 ${hero.inView ? 'animate-fade-in stagger-4' : ''}`}>
              <div className="rounded-xl border border-white/10 bg-[hsl(240_50%_12%)] shadow-2xl shadow-black/40 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                  <span className="ml-3 text-xs text-white/40 font-mono">cvzen.ai / search</span>
                </div>
                <div className="p-6 text-left">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Search className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white/90 mb-3 font-mono">
                        "Senior backend engineer who has scaled payments infrastructure in fintech"
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {["Payments", "Distributed Systems", "Go", "Kafka", "PostgreSQL", "Fintech"].map((t) => (
                          <span key={t} className="px-2.5 py-0.5 rounded-full text-[11px] bg-primary/15 text-primary border border-primary/25">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-white/40 font-mono pl-11">
                    → 24 matches ranked by semantic similarity • avg score 0.87
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── STATS ──────────── */}
      <section ref={stats.ref} className="py-16 md:py-20 border-y border-white/[0.06]" aria-label="Key metrics">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {STATS.map((s, i) => (
              <div key={s.label} className={`text-center md:text-left opacity-0 ${stats.inView ? `animate-fade-in stagger-${i + 1}` : ''}`}>
                <div className="text-4xl md:text-5xl font-extrabold mb-2 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                  <Counter end={s.value} suffix={s.suffix} />
                </div>
                <div className="text-sm font-semibold text-primary mb-3 tracking-wide uppercase">{s.label}</div>
                <p className="text-sm text-white/50 leading-relaxed max-w-xs mx-auto md:mx-0">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Mini testimonials */}
          <div className="mt-14 grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 hover:border-white/15 transition-colors">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />)}
                </div>
                <p className="text-sm text-white/75 leading-relaxed mb-4">"{t.quote}"</p>
                <div className="text-xs">
                  <div className="text-white/90 font-semibold">{t.author}</div>
                  <div className="text-white/40">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── SEMANTIC UNDERSTANDING ──────────── */}
      <section ref={semantic.ref} className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className={`text-center max-w-2xl mx-auto mb-14 opacity-0 ${semantic.inView ? 'animate-fade-in' : ''}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/25 bg-primary/10 mb-5">
              <Brain className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-semibold tracking-widest text-primary uppercase">Semantic Engine</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              We understand what you <span className="text-primary">mean</span>,
              <br />
              not just what you type.
            </h2>
            <p className="text-white/55 text-base md:text-lg leading-relaxed">
              Every CV and job description is converted into multi-dimensional vectors.
              Matches are ranked by intent — not surface-level keyword overlap.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-4">
            {/* Bad search */}
            <div className={`rounded-xl border border-red-500/20 bg-red-500/[0.04] p-6 opacity-0 ${semantic.inView ? 'animate-fade-in stagger-1' : ''}`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest text-red-400 bg-red-500/10 border border-red-500/30 uppercase">Keyword Search</span>
              </div>
              <div className="font-mono text-sm text-white/80 mb-3">"React developer"</div>
              <div className="text-xs text-white/40 mb-3 font-mono">misses → "JSX engineer", "frontend lead at React shop", "shipped Next.js apps"</div>
              <div className="text-xs text-red-400/80">Excludes 60%+ of qualified candidates.</div>
            </div>

            {/* Good search */}
            <div className={`rounded-xl border border-primary/30 bg-primary/[0.06] p-6 opacity-0 ${semantic.inView ? 'animate-fade-in stagger-2' : ''}`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest text-primary bg-primary/15 border border-primary/40 uppercase">Semantic Search</span>
              </div>
              <div className="font-mono text-sm text-white/80 mb-3">"React developer"</div>
              <div className="text-xs text-white/40 mb-3 font-mono">finds → engineers building component-driven UIs in modern JS frameworks</div>
              <div className="text-xs text-primary">Ranks the right people first, every time.</div>
            </div>
          </div>

          <div className={`max-w-3xl mx-auto mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center opacity-0 ${semantic.inView ? 'animate-fade-in stagger-3' : ''}`}>
            <p className="text-sm text-white/65 leading-relaxed">
              <span className="text-white font-semibold">A candidate who wrote "led checkout redesign"</span> still surfaces
              when you search for <span className="text-primary">"e-commerce conversion specialist."</span>
              <br className="hidden sm:block" />
              That's the cvZen difference.
            </p>
          </div>
        </div>
      </section>

      {/* ──────────── END OF PDF CV ──────────── */}
      <section ref={pdfDeath.ref} className="py-20 md:py-28 border-t border-white/[0.06] bg-white/[0.015]">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className={`opacity-0 ${pdfDeath.inView ? 'animate-fade-in' : ''}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/25 bg-primary/10 mb-5">
                <FileText className="h-3 w-3 text-primary" />
                <span className="text-[11px] font-semibold tracking-widest text-primary uppercase">Digital Profiles</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 leading-[1.1]">
                The end of<br />the PDF CV.
              </h2>
              <p className="text-white/60 text-base md:text-lg mb-8 leading-relaxed">
                Every cvZen account gets a living digital profile — structured, searchable, and always current.
                Share one URL, edit once, and you're done.
              </p>

              <div className="space-y-4 mb-8">
                {CV_PROBLEMS.map((p, i) => (
                  <div key={p.title} className="flex gap-4">
                    <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{i + 1}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">{p.title}</div>
                      <div className="text-sm text-white/55 leading-relaxed">{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Link to="/signup?role=candidate">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg shadow-primary/30 group">
                  Create Your Profile
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>

            {/* Profile mockup */}
            <div className={`opacity-0 ${pdfDeath.inView ? 'animate-fade-in stagger-2' : ''}`}>
              <div className="rounded-2xl border border-white/10 bg-[hsl(240_50%_12%)] p-6 shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[10px] font-bold tracking-widest text-primary uppercase">cvzen.ai/anika-r</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-500/10 text-green-400 border border-green-500/30">● Live</span>
                </div>
                <div className="flex items-start gap-4 mb-5">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-[hsl(220_80%_60%)] flex items-center justify-center text-lg font-bold text-white">AR</div>
                  <div>
                    <div className="font-bold text-white">Anika Roy</div>
                    <div className="text-xs text-white/55">Senior Product Designer · Bangalore</div>
                    <div className="flex gap-1.5 mt-2">
                      {["Figma", "Design Systems", "B2B SaaS"].map(t => (
                        <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-white/70 border border-white/10">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: "ATS Score", value: "92 / 100" },
                    { label: "Years Experience", value: "7+" },
                    { label: "Notable Projects", value: "12 shipped" },
                    { label: "Last Updated", value: "2 days ago" },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between py-2 border-b border-white/[0.06] last:border-0 text-sm">
                      <span className="text-white/50">{r.label}</span>
                      <span className="text-white font-semibold">{r.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-3 rounded-lg bg-primary/10 border border-primary/25">
                  <div className="text-[11px] text-primary font-semibold mb-1">RECRUITER VIEW</div>
                  <div className="text-xs text-white/70">Match score for "Senior PM with design background" — <span className="text-primary font-bold">0.91</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── FEATURES (DUAL) ──────────── */}
      <section id="features" ref={features.ref} className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className={`text-center max-w-2xl mx-auto mb-14 opacity-0 ${features.inView ? 'animate-fade-in' : ''}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/25 bg-primary/10 mb-5">
              <Layers className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-semibold tracking-widest text-primary uppercase">Built for both sides</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Everything you need to hire — or get hired.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {/* Candidate */}
            <div className={`rounded-2xl border border-white/10 bg-white/[0.02] p-7 opacity-0 ${features.inView ? 'animate-fade-in stagger-1' : ''}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-bold tracking-widest text-primary uppercase">For Candidates</div>
                  <div className="text-lg font-bold text-white">Get Discovered</div>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                {CANDIDATE_FEATURES.map((f) => (
                  <div key={f.title} className="flex gap-3">
                    <f.icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-white mb-0.5">{f.title}</div>
                      <div className="text-xs text-white/55 leading-relaxed">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/signup?role=candidate">
                <Button className="w-full bg-gradient-to-r from-[hsl(202_85%_55%)] to-[hsl(220_85%_60%)] text-white hover:opacity-90 font-semibold group">
                  Build Free CV
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>

            {/* Recruiter */}
            <div className={`rounded-2xl border border-white/10 bg-white/[0.02] p-7 opacity-0 ${features.inView ? 'animate-fade-in stagger-2' : ''}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-[hsl(280_70%_60%/0.15)] border border-[hsl(280_70%_60%/0.3)] flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-[hsl(280_85%_75%)]" />
                </div>
                <div>
                  <div className="text-xs font-bold tracking-widest text-[hsl(280_85%_75%)] uppercase">For Recruiters</div>
                  <div className="text-lg font-bold text-white">Hire Smarter</div>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                {RECRUITER_FEATURES.map((f) => (
                  <div key={f.title} className="flex gap-3">
                    <f.icon className="h-5 w-5 text-[hsl(280_85%_75%)] flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-white mb-0.5">{f.title}</div>
                      <div className="text-xs text-white/55 leading-relaxed">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/signup?role=recruiter">
                <Button className="w-full bg-gradient-to-r from-[hsl(280_75%_55%)] to-[hsl(260_80%_60%)] text-white hover:opacity-90 font-semibold group">
                  Try for Recruiters
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── HOW IT WORKS ──────────── */}
      <section id="how" ref={steps.ref} className="py-20 md:py-28 border-t border-white/[0.06] bg-white/[0.015]">
        <div className="container mx-auto px-6">
          <div className={`text-center max-w-2xl mx-auto mb-14 opacity-0 ${steps.inView ? 'animate-fade-in' : ''}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/25 bg-primary/10 mb-5">
              <Rocket className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-semibold tracking-widest text-primary uppercase">Quick start</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Up and running in minutes.</h2>
            <p className="text-white/55">Three steps from each side.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {[
              { title: "Candidates", icon: Users, steps: STEPS_CANDIDATE, color: "primary" },
              { title: "Recruiters", icon: Briefcase, steps: STEPS_RECRUITER, color: "purple" },
            ].map((group, gi) => (
              <div key={group.title} className={`rounded-2xl border border-white/10 bg-white/[0.02] p-6 opacity-0 ${steps.inView ? `animate-fade-in stagger-${gi + 1}` : ''}`}>
                <div className="text-xs font-bold tracking-widest text-white/50 uppercase mb-5">For {group.title}</div>
                <div className="space-y-5">
                  {group.steps.map((s, i) => (
                    <div key={s.title} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-9 w-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
                          <s.icon className="h-4 w-4 text-primary" />
                        </div>
                        {i < group.steps.length - 1 && <div className="w-px flex-1 bg-white/10 mt-2" />}
                      </div>
                      <div className="pb-4">
                        <div className="text-sm font-semibold text-white mb-1">{s.title}</div>
                        <div className="text-xs text-white/55 leading-relaxed">{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── PRICING PREVIEW ──────────── */}
      <section ref={pricing.ref} className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className={`text-center max-w-2xl mx-auto mb-14 opacity-0 ${pricing.inView ? 'animate-fade-in' : ''}`}>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Simple, transparent pricing.</h2>
            <p className="text-white/55">Start free. Upgrade when you need more.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PRICING_PREVIEW.map((p, i) => (
              <div
                key={p.name}
                className={`relative rounded-2xl p-7 opacity-0 ${pricing.inView ? `animate-fade-in stagger-${i + 1}` : ''} ${
                  p.highlight
                    ? 'border-2 border-primary bg-primary/[0.06] shadow-xl shadow-primary/20'
                    : 'border border-white/10 bg-white/[0.02]'
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-primary-foreground bg-primary uppercase">Most Popular</span>
                )}
                <div className="text-sm font-semibold text-white/70 mb-2">{p.name}</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-extrabold text-white">{p.price}</span>
                  <span className="text-sm text-white/50">{p.period}</span>
                </div>
                <p className="text-xs text-white/50 mb-5">{p.desc}</p>
                <ul className="space-y-2.5 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/75">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/pricing">
                  <Button className={`w-full font-semibold ${p.highlight ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-white/10 text-white hover:bg-white/15 border border-white/15'}`}>
                    {p.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/pricing" className="text-sm text-primary hover:text-primary/80 inline-flex items-center gap-1 font-medium">
              See all plans & features
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────── INSIGHTS ──────────── */}
      <section id="insights" ref={insights.ref} className="py-20 md:py-28 border-t border-white/[0.06] bg-white/[0.015]">
        <div className="container mx-auto px-6">
          <div className={`flex items-end justify-between mb-10 opacity-0 ${insights.inView ? 'animate-fade-in' : ''}`}>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/25 bg-primary/10 mb-4">
                <Lightbulb className="h-3 w-3 text-primary" />
                <span className="text-[11px] font-semibold tracking-widest text-primary uppercase">From the blog</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Career tips & hiring insights.</h2>
            </div>
            <Link to="/" className="hidden sm:inline-flex text-sm text-white/60 hover:text-white items-center gap-1">
              See all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {INSIGHTS.map((post, i) => (
              <article
                key={post.title}
                className={`rounded-xl border border-white/10 bg-white/[0.02] p-6 hover:border-primary/30 hover:bg-white/[0.04] transition-all group cursor-pointer opacity-0 ${insights.inView ? `animate-fade-in stagger-${i + 1}` : ''}`}
              >
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest text-primary bg-primary/10 border border-primary/25 uppercase mb-4">{post.tag}</span>
                <h3 className="text-base font-bold text-white mb-2 leading-snug group-hover:text-primary transition-colors">{post.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{post.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── FINAL CTA ──────────── */}
      <section ref={cta.ref} className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className={`max-w-4xl mx-auto rounded-3xl border border-primary/25 p-10 md:p-16 text-center relative overflow-hidden opacity-0 ${cta.inView ? 'animate-fade-in' : ''}`}
            style={{ background: 'radial-gradient(circle at 50% 0%, hsl(202 75% 30% / 0.4), hsl(240 55% 12%) 70%)' }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/15 mb-6">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-semibold tracking-widest text-primary uppercase">Join the paperless era</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 leading-[1.1]">
              Start hiring smarter — or<br />land your next role faster.
            </h2>
            <p className="text-white/60 text-base md:text-lg mb-8 max-w-xl mx-auto">
              Join the world's first paperless hiring platform. Built for the next decade of work.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup?role=candidate">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/40 font-semibold h-12 px-8 group focus-ring">
                  Build Your Free CV
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link to="/signup?role=recruiter">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/[0.05] border-white/20 text-white hover:bg-white/10 hover:border-white/30 h-12 px-8 font-semibold focus-ring">
                  Hire with cvZen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── FOOTER ──────────── */}
      <footer className="border-t border-white/[0.06] py-12" style={{ background: 'hsl(240 55% 8%)' }} role="contentinfo">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-8 mb-10">
            <div className="md:col-span-2">
              <img src={logoHeader} alt="cvZen" className="h-9 w-auto mb-3" />
              <p className="text-sm text-white/50 max-w-xs leading-relaxed">
                The world's first paperless hiring platform. Built for candidates and recruiters who think semantically.
              </p>
            </div>
            {[
              { title: "Product", links: [{ label: "Features", href: "#features" }, { label: "Pricing", href: "/pricing" }, { label: "How it works", href: "#how" }] },
              { title: "Company", links: [{ label: "Brand", href: "/brand" }, { label: "Insights", href: "#insights" }] },
              { title: "Legal", links: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }, { label: "Disclaimer", href: "/disclaimer" }] },
            ].map(col => (
              <div key={col.title}>
                <div className="text-xs font-bold tracking-widest text-white/90 uppercase mb-4">{col.title}</div>
                <ul className="space-y-2">
                  {col.links.map(l => (
                    <li key={l.label}>
                      {l.href.startsWith('#') ? (
                        <a href={l.href} className="text-sm text-white/55 hover:text-white transition-colors">{l.label}</a>
                      ) : (
                        <Link to={l.href} className="text-sm text-white/55 hover:text-white transition-colors">{l.label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-white/40">© {new Date().getFullYear()} cvZen. All rights reserved.</span>
            <span className="text-xs text-white/40">cvzen.ai · Intelligent Hiring OS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
