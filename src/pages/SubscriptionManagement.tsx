import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, FileText, User, Search, Target, Calendar,
  PlusCircle, Inbox, CreditCard, Crown, ArrowUpRight, ArrowDownRight,
  Receipt, Download, Loader2, CheckCircle2, XCircle, Clock, Zap,
  TrendingUp, AlertCircle, Sparkles, Building2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const candidateNavItems = [
  { label: "Dashboard", href: "/candidate", icon: LayoutDashboard },
  { label: "My CV", href: "/candidate/resume", icon: FileText },
  { label: "Digital Profile", href: "/candidate/profile", icon: User },
  { label: "ATS Score", href: "/candidate/ats-score", icon: Target },
  { label: "Search Jobs", href: "/candidate/search", icon: Search },
  { label: "Interviews", href: "/candidate/interviews", icon: Calendar },
  { label: "Billing", href: "/candidate/billing", icon: CreditCard },
];

const recruiterNavItems = [
  { label: "Dashboard", href: "/recruiter", icon: LayoutDashboard },
  { label: "Post Job", href: "/recruiter/post-job", icon: PlusCircle },
  { label: "My Jobs", href: "/recruiter/jobs", icon: FileText },
  { label: "Applications", href: "/recruiter/applications", icon: Inbox },
  { label: "Search Candidates", href: "/recruiter/search", icon: Search },
  { label: "Interviews", href: "/recruiter/interviews", icon: Calendar },
  { label: "Billing", href: "/recruiter/billing", icon: CreditCard },
];

const PLAN_ICONS: Record<string, any> = { Free: Zap, Starter: Sparkles, Pro: Crown, Enterprise: Building2 };

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

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  gateway_name: string | null;
  created_at: string;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  gateway_name: string;
  gateway_order_id: string | null;
  gateway_transaction_id: string | null;
  created_at: string;
  metadata: any;
}

interface UsageItem {
  feature_key: string;
  usage_count: number;
  period_start: string;
  period_end: string;
}

const SubscriptionManagement = ({ role }: { role: "candidate" | "recruiter" }) => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [usage, setUsage] = useState<UsageItem[]>([]);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { navigate("/login"); return; }
      setUser(u);

      const [plansRes, subRes, txnRes, usageRes] = await Promise.all([
        supabase.from("plans").select("*").eq("target_role", role).order("display_order"),
        supabase.from("subscriptions").select("*").eq("user_id", u.id).eq("status", "active").order("created_at", { ascending: false }).limit(1),
        supabase.from("payment_transactions").select("*").eq("user_id", u.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("usage_tracking").select("*").eq("user_id", u.id).order("period_start", { ascending: false }).limit(20),
      ]);

      const plans = (plansRes.data || []) as unknown as Plan[];
      setAllPlans(plans);

      const activeSub = subRes.data?.[0] as unknown as Subscription | undefined;
      setSubscription(activeSub || null);

      if (activeSub) {
        const plan = plans.find(p => p.id === activeSub.plan_id);
        setCurrentPlan(plan || null);
      } else {
        // Default to free plan
        const freePlan = plans.find(p => p.price_monthly === 0);
        setCurrentPlan(freePlan || null);
      }

      setTransactions((txnRes.data || []) as unknown as Transaction[]);
      setUsage((usageRes.data || []) as unknown as UsageItem[]);
      setLoading(false);
    };
    load();
  }, [role, navigate]);

  const handleChangePlan = async (plan: Plan) => {
    if (!user) return;
    if (plan.price_monthly === 0) {
      toast({ title: "Free Plan", description: "You're already on the free tier." });
      return;
    }

    setSubscribing(plan.id);
    try {
      const billingCycle = subscription?.billing_cycle || "monthly";
      const price = billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;

      const { data: gwRes } = await supabase.from("payment_gateway_config").select("gateway_name").eq("is_active", true).limit(1).single();

      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          plan_id: plan.id,
          billing_cycle: billingCycle,
          amount: price,
          currency: plan.currency,
          gateway: gwRes?.gateway_name || "phonepe",
        },
      });

      if (error) throw error;
      if (data?.payment_url) {
        window.location.href = data.payment_url;
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubscribing(null);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "active": case "completed": return "bg-green-100 text-green-700 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "failed": case "cancelled": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatLimit = (v: number) => v === -1 ? "Unlimited" : String(v);

  const navItems = role === "candidate" ? candidateNavItems : recruiterNavItems;

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} role={role}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const isUpgrade = (plan: Plan) => {
    if (!currentPlan) return true;
    return plan.display_order > currentPlan.display_order;
  };

  // Group usage by feature for current period
  const currentUsage = usage.reduce<Record<string, number>>((acc, u) => {
    acc[u.feature_key] = (acc[u.feature_key] || 0) + u.usage_count;
    return acc;
  }, {});

  return (
    <DashboardLayout navItems={navItems} role={role}>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Billing & Subscription</h1>
            <p className="text-muted-foreground text-sm">Manage your plan, usage, and payment history.</p>
          </div>
          <Link to="/pricing">
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-1" /> View All Plans
            </Button>
          </Link>
        </div>

        {/* Current Plan Card */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                {currentPlan && PLAN_ICONS[currentPlan.name] ? (
                  (() => { const Icon = PLAN_ICONS[currentPlan.name]; return <Icon className="h-6 w-6 text-primary" />; })()
                ) : (
                  <CreditCard className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{currentPlan?.name || "Free"} Plan</h2>
                  {subscription && (
                    <Badge className={`text-xs border ${statusColor(subscription.status)}`}>
                      {subscription.status}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscription ? (
                    <>
                      {subscription.billing_cycle === "yearly" ? "Yearly" : "Monthly"} billing
                      {" · "}Renews {new Date(subscription.current_period_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </>
                  ) : (
                    "No active subscription — you're on the free tier"
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              {currentPlan && currentPlan.price_monthly > 0 && (
                <p className="text-2xl font-bold text-foreground">
                  ₹{(subscription?.billing_cycle === "yearly" ? currentPlan.price_yearly : currentPlan.price_monthly).toLocaleString("en-IN")}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{subscription?.billing_cycle === "yearly" ? "yr" : "mo"}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Usage Overview */}
        {currentPlan && Object.keys(currentPlan.limits).length > 0 && (
          <div className="bg-card rounded-2xl border border-border shadow-card p-6 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Usage This Period
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(currentPlan.limits).map(([key, limit]) => {
                const used = currentUsage[key] || 0;
                const pct = limit === -1 ? 0 : Math.min(100, Math.round((used / limit) * 100));
                const isNearLimit = limit !== -1 && pct >= 80;

                return (
                  <div key={key} className="p-4 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-muted-foreground">{FEATURE_LABELS[key] || key}</p>
                      {isNearLimit && <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />}
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {used} <span className="text-sm font-normal text-muted-foreground">/ {formatLimit(limit)}</span>
                    </p>
                    {limit !== -1 && (
                      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-primary"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Plans (upgrade/downgrade) */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Change Plan</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {allPlans.map((plan) => {
              const isCurrent = currentPlan?.id === plan.id;
              const upgrade = isUpgrade(plan);

              return (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-4 transition-all ${
                    isCurrent
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {(() => { const Icon = PLAN_ICONS[plan.name] || Zap; return <Icon className="h-4 w-4 text-primary" />; })()}
                    <span className="font-semibold text-sm text-foreground">{plan.name}</span>
                    {plan.is_popular && <Badge className="text-[10px] bg-primary/10 text-primary border-0 px-1.5">Popular</Badge>}
                  </div>
                  <p className="text-xl font-bold text-foreground mb-3">
                    {plan.price_monthly === 0 ? "Free" : `₹${plan.price_monthly.toLocaleString("en-IN")}`}
                    {plan.price_monthly > 0 && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
                  </p>
                  {isCurrent ? (
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Current Plan
                    </Button>
                  ) : plan.name === "Enterprise" ? (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href="mailto:enterprise@cvzen.ai">Contact Sales</a>
                    </Button>
                  ) : (
                    <Button
                      variant={upgrade ? "default" : "outline"}
                      size="sm"
                      className="w-full"
                      disabled={subscribing === plan.id}
                      onClick={() => handleChangePlan(plan)}
                    >
                      {subscribing === plan.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : upgrade ? (
                        <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5 mr-1" />
                      )}
                      {upgrade ? "Upgrade" : "Downgrade"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment History / Invoices */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Payment History & Invoices
          </h3>

          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <CreditCard className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No payment history yet.</p>
              <p className="text-muted-foreground text-xs mt-1">Transactions will appear here once you subscribe to a plan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-3 pr-4 font-medium text-muted-foreground">Date</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground">Invoice ID</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground">Amount</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground">Gateway</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="py-3 font-medium text-muted-foreground">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-4 text-foreground">
                        {new Date(txn.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </td>
                      <td className="py-3 pr-4">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">
                          {txn.gateway_order_id?.slice(0, 16) || txn.id.slice(0, 8)}
                        </code>
                      </td>
                      <td className="py-3 pr-4 font-semibold text-foreground">
                        ₹{Number(txn.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground capitalize">{txn.gateway_name}</td>
                      <td className="py-3 pr-4">
                        <Badge className={`text-xs border ${statusColor(txn.status)}`}>
                          {txn.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {txn.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                          {txn.status === "failed" && <XCircle className="h-3 w-3 mr-1" />}
                          {txn.status}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {txn.status === "completed" && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            <Download className="h-3 w-3 mr-1" /> PDF
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SubscriptionManagement;
