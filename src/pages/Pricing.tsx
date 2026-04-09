import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, X, Sparkles, Zap, Crown, Building2, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoHeader from "@/assets/logo-header.svg";

interface Plan {
  id: string;
  name: string;
  slug: string;
  target_role: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  is_popular: boolean;
  display_order: number;
}

interface GatewayConfig {
  gateway_name: string;
  display_name: string;
  is_active: boolean;
}

const FEATURE_LABELS: Record<string, string> = {
  ai_cv_optimization: "AI CV Optimization",
  job_applications: "Job Applications",
  ats_score: "ATS Score Analysis",
  cover_letter: "Cover Letter Generation",
  job_postings: "Active Job Posts",
  ai_job_description: "AI Job Descriptions",
  candidate_search: "Candidate Searches",
  interview_scheduling: "Interview Scheduling",
  priority_support: "Priority Support",
  dedicated_manager: "Dedicated Manager",
  analytics: "Advanced Analytics",
  api_access: "API Access",
};

const PLAN_ICONS = [Zap, Sparkles, Crown, Building2];
const PLAN_COLORS = [
  "from-muted/50 to-muted/30",
  "from-primary/10 to-primary/5",
  "from-accent/10 to-accent/5",
  "from-primary/15 to-accent/10",
];

const Pricing = () => {
  const [role, setRole] = useState<"candidate" | "recruiter">("candidate");
  const [yearly, setYearly] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const [plansRes, gatewayRes, authRes] = await Promise.all([
        supabase.from("plans").select("*").order("display_order"),
        supabase.from("payment_gateway_config").select("*"),
        supabase.auth.getUser(),
      ]);
      if (plansRes.data) setPlans(plansRes.data as unknown as Plan[]);
      if (gatewayRes.data) setGateways(gatewayRes.data as unknown as GatewayConfig[]);
      setUser(authRes.data?.user ?? null);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredPlans = plans.filter((p) => p.target_role === role);
  const activeGateway = gateways.find((g) => g.is_active);

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (plan.price_monthly === 0) {
      toast({ title: "Free Plan", description: "You're already on the free plan!" });
      return;
    }

    setSubscribing(plan.id);

    try {
      const price = yearly ? plan.price_yearly : plan.price_monthly;
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          plan_id: plan.id,
          billing_cycle: yearly ? "yearly" : "monthly",
          amount: price,
          currency: plan.currency,
          gateway: activeGateway?.gateway_name || "phonepe",
        },
      });

      if (error) throw error;

      if (data?.payment_url) {
        window.location.href = data.payment_url;
      } else if (data?.order_id) {
        toast({ title: "Order Created", description: `Order ID: ${data.order_id}. Redirecting to payment...` });
      }
    } catch (err: any) {
      toast({ title: "Payment Error", description: err.message || "Failed to initiate payment", variant: "destructive" });
    } finally {
      setSubscribing(null);
    }
  };

  const formatLimit = (val: number) => (val === -1 ? "Unlimited" : val.toString());

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 w-full z-50 border-b border-white/[0.08]" style={{ background: 'hsl(240 55% 16%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoHeader} alt="CVZen" className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" asChild><Link to="/login">Sign In</Link></Button>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/85 font-semibold" asChild><Link to="/signup">Get Started</Link></Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Title */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 text-xs tracking-wide">PRICING</Badge>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Plans that scale with you
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Whether you're a candidate looking for your next opportunity or a recruiter building world-class teams.
          </p>
        </div>

        {/* Role Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-muted rounded-xl p-1 gap-1">
            <button
              onClick={() => setRole("candidate")}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                role === "candidate"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              For Candidates
            </button>
            <button
              onClick={() => setRole("recruiter")}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                role === "recruiter"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              For Recruiters
            </button>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm font-medium ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
          <Switch checked={yearly} onCheckedChange={setYearly} />
          <span className={`text-sm font-medium ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
            Yearly
          </span>
          {yearly && (
            <Badge className="bg-green-100 text-green-700 text-xs border-0">Save 17%</Badge>
          )}
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredPlans.map((plan, i) => {
            const Icon = PLAN_ICONS[i] || Zap;
            const price = yearly ? plan.price_yearly : plan.price_monthly;
            const period = yearly ? "/year" : "/month";

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border ${
                  plan.is_popular
                    ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                    : "border-border"
                } bg-gradient-to-b ${PLAN_COLORS[i]} p-6 flex flex-col`}
              >
                {plan.is_popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 border-0">
                    Most Popular
                  </Badge>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <div className={`p-2 rounded-lg ${plan.is_popular ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`h-5 w-5 ${plan.is_popular ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                </div>

                <div className="mb-6">
                  {price === 0 ? (
                    <div className="text-3xl font-bold text-foreground">Free</div>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold text-foreground">₹{price.toLocaleString("en-IN")}</span>
                      <span className="text-muted-foreground text-sm">{period}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3 mb-6">
                  {Object.entries(plan.limits as Record<string, number>).map(([key, limit]) => (
                    <div key={key} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground">
                        <strong>{formatLimit(limit)}</strong>{" "}
                        {FEATURE_LABELS[key] || key}
                        {limit !== -1 && " / mo"}
                      </span>
                    </div>
                  ))}
                  {Object.entries(plan.features as Record<string, boolean>)
                    .filter(([key]) => !plan.limits.hasOwnProperty(key))
                    .map(([key, enabled]) => (
                      <div key={key} className="flex items-start gap-2 text-sm">
                        {enabled ? (
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                        )}
                        <span className={enabled ? "text-foreground" : "text-muted-foreground/50"}>
                          {FEATURE_LABELS[key] || key}
                        </span>
                      </div>
                    ))}
                </div>

                <Button
                  onClick={() => handleSubscribe(plan)}
                  disabled={subscribing === plan.id}
                  variant={plan.is_popular ? "default" : "outline"}
                  className={`w-full ${plan.is_popular ? "" : ""}`}
                >
                  {subscribing === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {price === 0 ? "Get Started Free" : plan.name === "Enterprise" ? "Contact Sales" : "Subscribe"}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Active Gateway Badge */}
        {activeGateway && (
          <div className="text-center mt-10">
            <p className="text-xs text-muted-foreground">
              Payments powered by <span className="font-medium text-foreground">{activeGateway.display_name}</span>
              {" · "}Secure & encrypted
            </p>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "Can I switch plans anytime?", a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated." },
              { q: "What happens when I reach my limit?", a: "You'll receive a notification when you're close to your limit. Once reached, you can upgrade your plan or wait for the next billing cycle." },
              { q: "Is there a refund policy?", a: "We offer a 7-day money-back guarantee on all paid plans. No questions asked." },
              { q: "What payment methods are accepted?", a: "We support UPI, credit/debit cards, net banking, and digital wallets through our integrated payment gateway." },
            ].map((faq, i) => (
              <details key={i} className="group border border-border rounded-xl p-4 bg-card">
                <summary className="font-medium text-foreground cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-muted-foreground group-open:rotate-45 transition-transform text-xl">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/privacy" className="hover:text-foreground transition">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition">Terms</Link>
            <Link to="/disclaimer" className="hover:text-foreground transition">Disclaimer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
