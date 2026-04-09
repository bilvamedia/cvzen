import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  LayoutDashboard, FileText, User, Search, Target, Calendar,
  PlusCircle, Inbox, CreditCard, Crown, ArrowUpRight, ArrowDownRight,
  Receipt, Download, Loader2, CheckCircle2, XCircle, Clock, Zap,
  TrendingUp, AlertCircle, Sparkles, Building2, Ban, RotateCcw,
  Settings, PartyPopper, Info
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
  { label: "Settings", href: "/candidate/settings", icon: Settings },
];

const recruiterNavItems = [
  { label: "Dashboard", href: "/recruiter", icon: LayoutDashboard },
  { label: "Post Job", href: "/recruiter/post-job", icon: PlusCircle },
  { label: "My Jobs", href: "/recruiter/jobs", icon: FileText },
  { label: "Applications", href: "/recruiter/applications", icon: Inbox },
  { label: "Search Candidates", href: "/recruiter/search", icon: Search },
  { label: "Interviews", href: "/recruiter/interviews", icon: Calendar },
  { label: "Billing", href: "/recruiter/billing", icon: CreditCard },
  { label: "Settings", href: "/recruiter/settings", icon: Settings },
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
  id: string; name: string; slug: string; target_role: string;
  price_monthly: number; price_yearly: number; currency: string;
  features: Record<string, boolean>; limits: Record<string, number>;
  is_popular: boolean; display_order: number;
}

interface Subscription {
  id: string; plan_id: string; status: string; billing_cycle: string;
  current_period_start: string; current_period_end: string;
  gateway_name: string | null; created_at: string;
}

interface Transaction {
  id: string; amount: number; currency: string; status: string;
  gateway_name: string; gateway_order_id: string | null;
  gateway_transaction_id: string | null; created_at: string; metadata: any;
  subscription_id: string | null;
}

interface UsageItem {
  feature_key: string; usage_count: number;
  period_start: string; period_end: string;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedTxn, setConfirmedTxn] = useState<Transaction | null>(null);
  const [confirmedPlanName, setConfirmedPlanName] = useState("");

  // Modal states
  const [cancelDialog, setCancelDialog] = useState(false);
  const [refundDialog, setRefundDialog] = useState(false);
  const [refundTxn, setRefundTxn] = useState<Transaction | null>(null);
  const [downgradeDialog, setDowngradeDialog] = useState(false);
  const [downgradePlan, setDowngradePlan] = useState<Plan | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) { navigate("/login"); return; }
    setUser(u);

    const [plansRes, subRes, txnRes, usageRes] = await Promise.all([
      supabase.from("plans").select("*").eq("target_role", role).order("display_order"),
      supabase.from("subscriptions").select("*").eq("user_id", u.id).in("status", ["active", "pending"]).order("created_at", { ascending: false }).limit(1),
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
      const freePlan = plans.find(p => p.price_monthly === 0);
      setCurrentPlan(freePlan || null);
    }

    const txns = (txnRes.data || []) as unknown as Transaction[];
    setTransactions(txns);
    setUsage((usageRes.data || []) as unknown as UsageItem[]);
    setLoading(false);

    return { plans, txns, user: u };
  }, [role, navigate]);

  useEffect(() => {
    const init = async () => {
      const result = await loadData();
      if (!result) return;

      // Handle payment redirect
      const paymentStatus = searchParams.get("payment_status");
      const txnId = searchParams.get("txn_id");
      if (paymentStatus === "success" && txnId) {
        const txn = result.txns.find(t => t.gateway_order_id === txnId);
        if (txn) {
          const planMeta = txn.metadata as any;
          setConfirmedTxn(txn);
          setConfirmedPlanName(planMeta?.plan_name || "");
          setShowConfirmation(true);
        }
        // Clean URL
        setSearchParams({}, { replace: true });
      }
    };
    init();
  }, [role]);

  const handleChangePlan = async (plan: Plan) => {
    if (!user) return;
    if (plan.price_monthly === 0) {
      toast({ title: "Free Plan", description: "You're already on the free tier." });
      return;
    }

    // Check for downgrade
    if (currentPlan && plan.display_order < currentPlan.display_order && currentPlan.price_monthly > 0) {
      setDowngradePlan(plan);
      setDowngradeDialog(true);
      return;
    }

    await initiatePayment(plan);
  };

  const initiatePayment = async (plan: Plan) => {
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

  const handleDowngradeConfirm = async () => {
    if (!downgradePlan || !user || !subscription) return;
    setActionLoading(true);
    try {
      // For downgrade: calculate prorated credit, then switch plan immediately
      const billingCycle = subscription.billing_cycle || "monthly";
      const newPrice = billingCycle === "yearly" ? downgradePlan.price_yearly : downgradePlan.price_monthly;

      if (newPrice === 0) {
        // Downgrade to free = cancel subscription
        await handleCancelConfirm();
        setDowngradeDialog(false);
        setDowngradePlan(null);
        return;
      }

      // Switch plan on current subscription
      const { error } = await supabase
        .from("subscriptions")
        .update({ plan_id: downgradePlan.id, updated_at: new Date().toISOString() })
        .eq("id", subscription.id);

      if (error) throw error;

      // Record a $0 transaction for audit trail
      await supabase.from("payment_transactions").insert({
        user_id: user.id,
        subscription_id: subscription.id,
        amount: 0,
        currency: downgradePlan.currency,
        gateway_name: subscription.gateway_name || "internal",
        gateway_order_id: `DWN_${Date.now()}`,
        status: "completed",
        metadata: {
          type: "downgrade",
          from_plan: currentPlan?.name,
          to_plan: downgradePlan.name,
          prorated_credit: calculateProratedCredit(),
        },
      });

      toast({ title: "Plan Downgraded", description: `Switched to ${downgradePlan.name}. Prorated credit will apply on next billing.` });
      setDowngradeDialog(false);
      setDowngradePlan(null);
      await loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!subscription || !user) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", subscription.id);

      if (error) throw error;

      await supabase.from("payment_transactions").insert({
        user_id: user.id,
        subscription_id: subscription.id,
        amount: 0,
        currency: currentPlan?.currency || "INR",
        gateway_name: subscription.gateway_name || "internal",
        gateway_order_id: `CXL_${Date.now()}`,
        status: "completed",
        metadata: { type: "cancellation", plan_name: currentPlan?.name },
      });

      toast({ title: "Subscription Cancelled", description: "Your plan has been cancelled. You'll retain access until the end of your billing period." });
      setCancelDialog(false);
      await loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefundRequest = async () => {
    if (!refundTxn || !user) return;
    setActionLoading(true);
    try {
      // Record refund request as a transaction note
      await supabase.from("payment_transactions").insert({
        user_id: user.id,
        subscription_id: refundTxn.subscription_id,
        amount: Number(refundTxn.amount),
        currency: refundTxn.currency,
        gateway_name: refundTxn.gateway_name,
        gateway_order_id: `RFD_${Date.now()}`,
        status: "pending",
        metadata: {
          type: "refund_request",
          original_txn_id: refundTxn.id,
          original_order_id: refundTxn.gateway_order_id,
        },
      });

      toast({ title: "Refund Requested", description: "Your refund request has been submitted. It will be processed within 5-7 business days." });
      setRefundDialog(false);
      setRefundTxn(null);
      await loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const calculateProratedCredit = () => {
    if (!subscription || !currentPlan || !downgradePlan) return 0;
    const start = new Date(subscription.current_period_start).getTime();
    const end = new Date(subscription.current_period_end).getTime();
    const now = Date.now();
    const totalDays = (end - start) / (1000 * 60 * 60 * 24);
    const remainingDays = Math.max(0, (end - now) / (1000 * 60 * 60 * 24));
    const billingCycle = subscription.billing_cycle || "monthly";
    const currentPrice = billingCycle === "yearly" ? currentPlan.price_yearly : currentPlan.price_monthly;
    const newPrice = billingCycle === "yearly" ? downgradePlan.price_yearly : downgradePlan.price_monthly;
    const dailyDiff = (currentPrice - newPrice) / totalDays;
    return Math.round(dailyDiff * remainingDays);
  };

  const generateInvoiceData = (txn: Transaction) => {
    const meta = txn.metadata as any;
    return {
      invoiceId: txn.gateway_order_id || txn.id.slice(0, 12).toUpperCase(),
      date: new Date(txn.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      planName: meta?.plan_name || meta?.to_plan || "N/A",
      billingCycle: meta?.billing_cycle || "monthly",
      amount: Number(txn.amount),
      currency: txn.currency,
      status: txn.status,
      gateway: txn.gateway_name,
      type: meta?.type || "payment",
    };
  };

  const downloadInvoice = (txn: Transaction) => {
    const inv = generateInvoiceData(txn);
    const lines = [
      "═══════════════════════════════════════",
      "                INVOICE                ",
      "              CVZen.ai                 ",
      "═══════════════════════════════════════",
      "",
      `Invoice ID:     ${inv.invoiceId}`,
      `Date:           ${inv.date}`,
      `Status:         ${inv.status.toUpperCase()}`,
      "",
      "───────────────────────────────────────",
      "DETAILS",
      "───────────────────────────────────────",
      `Plan:           ${inv.planName}`,
      `Billing Cycle:  ${inv.billingCycle}`,
      `Payment Method: ${inv.gateway}`,
      `Type:           ${inv.type}`,
      "",
      "───────────────────────────────────────",
      `TOTAL:          ₹${inv.amount.toLocaleString("en-IN")}`,
      "───────────────────────────────────────",
      "",
      "Thank you for your subscription!",
      "For support: support@cvzen.ai",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CVZen_Invoice_${inv.invoiceId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "active": case "completed": return "bg-green-100 text-green-700 border-green-200";
      case "pending": case "processing": return "bg-yellow-100 text-yellow-700 border-yellow-200";
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

  const isDowngrade = (plan: Plan) => {
    if (!currentPlan) return false;
    return plan.display_order < currentPlan.display_order;
  };

  const currentUsage = usage.reduce<Record<string, number>>((acc, u) => {
    acc[u.feature_key] = (acc[u.feature_key] || 0) + u.usage_count;
    return acc;
  }, {});

  const daysRemaining = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <DashboardLayout navItems={navItems} role={role}>
      <div className="max-w-5xl">
        {/* Payment Confirmation Banner */}
        {showConfirmation && confirmedTxn && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <PartyPopper className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-800">Payment Successful!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Your <strong>{confirmedPlanName}</strong> plan is now active. Transaction ID: <code className="bg-green-100 px-1.5 py-0.5 rounded text-xs font-mono">{confirmedTxn.gateway_order_id}</code>
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-100" onClick={() => downloadInvoice(confirmedTxn)}>
                    <Download className="h-3.5 w-3.5 mr-1" /> Download Invoice
                  </Button>
                  <Button size="sm" variant="ghost" className="text-green-600" onClick={() => setShowConfirmation(false)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  {subscription && subscription.status === "active" ? (
                    <>
                      {subscription.billing_cycle === "yearly" ? "Yearly" : "Monthly"} billing
                      {" · "}{daysRemaining} days remaining
                      {" · "}Renews {new Date(subscription.current_period_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </>
                  ) : (
                    "No active subscription — you're on the free tier"
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentPlan && currentPlan.price_monthly > 0 && (
                <p className="text-2xl font-bold text-foreground">
                  ₹{(subscription?.billing_cycle === "yearly" ? currentPlan.price_yearly : currentPlan.price_monthly).toLocaleString("en-IN")}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{subscription?.billing_cycle === "yearly" ? "yr" : "mo"}
                  </span>
                </p>
              )}
              {subscription && subscription.status === "active" && currentPlan && currentPlan.price_monthly > 0 && (
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setCancelDialog(true)}>
                  <Ban className="h-3.5 w-3.5 mr-1" /> Cancel
                </Button>
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
                          className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-primary"}`}
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
              const downgrade = isDowngrade(plan);

              return (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-4 transition-all ${
                    isCurrent ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {(() => { const Icon = PLAN_ICONS[plan.name] || Zap; return <Icon className="h-4 w-4 text-primary" />; })()}
                    <span className="font-semibold text-sm text-foreground">{plan.name}</span>
                    {plan.is_popular && <Badge className="text-[10px] bg-primary/10 text-primary border-0 px-1.5">Popular</Badge>}
                  </div>
                  <p className="text-xl font-bold text-foreground mb-1">
                    {plan.price_monthly === 0 ? "Free" : `₹${plan.price_monthly.toLocaleString("en-IN")}`}
                    {plan.price_monthly > 0 && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
                  </p>
                  {/* Show proration info for downgrades */}
                  {downgrade && subscription?.status === "active" && currentPlan && currentPlan.price_monthly > 0 && (
                    <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Credit of ~₹{(() => {
                        const start = new Date(subscription.current_period_start).getTime();
                        const end = new Date(subscription.current_period_end).getTime();
                        const now = Date.now();
                        const totalDays = (end - start) / (1000 * 60 * 60 * 24);
                        const remainingDays = Math.max(0, (end - now) / (1000 * 60 * 60 * 24));
                        const bc = subscription.billing_cycle || "monthly";
                        const cp = bc === "yearly" ? currentPlan.price_yearly : currentPlan.price_monthly;
                        const np = bc === "yearly" ? plan.price_yearly : plan.price_monthly;
                        return Math.round(((cp - np) / totalDays) * remainingDays);
                      })()} on next bill
                    </p>
                  )}
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
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-3 pr-4 font-medium text-muted-foreground">Date</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground">Invoice ID</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground">Type</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground">Amount</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => {
                    const meta = txn.metadata as any;
                    const txnType = meta?.type || "payment";
                    const isRefundable = txn.status === "completed" && txnType === "payment" && Number(txn.amount) > 0 &&
                      (Date.now() - new Date(txn.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000; // 7 days

                    return (
                      <tr key={txn.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3 pr-4 text-foreground">
                          {new Date(txn.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-3 pr-4">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">
                            {txn.gateway_order_id?.slice(0, 18) || txn.id.slice(0, 8)}
                          </code>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {txnType === "refund_request" ? "Refund" : txnType === "downgrade" ? "Downgrade" : txnType === "cancellation" ? "Cancel" : "Payment"}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 font-semibold text-foreground">
                          ₹{Number(txn.amount).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge className={`text-xs border ${statusColor(txn.status)}`}>
                            {txn.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {(txn.status === "pending" || txn.status === "processing") && <Clock className="h-3 w-3 mr-1" />}
                            {txn.status === "failed" && <XCircle className="h-3 w-3 mr-1" />}
                            {txn.status}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            {txn.status === "completed" && Number(txn.amount) > 0 && (
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => downloadInvoice(txn)}>
                                <Download className="h-3 w-3 mr-1" /> Invoice
                              </Button>
                            )}
                            {isRefundable && (
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-orange-600 hover:text-orange-700" onClick={() => { setRefundTxn(txn); setRefundDialog(true); }}>
                                <RotateCcw className="h-3 w-3 mr-1" /> Refund
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your <strong>{currentPlan?.name}</strong> plan? You'll retain access until{" "}
              {subscription && new Date(subscription.current_period_end).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <ul className="space-y-1.5">
              <li>• Your data will be preserved</li>
              <li>• You can resubscribe anytime</li>
              <li>• Access continues until billing period ends</li>
              <li>• Eligible transactions can be refunded within 7 days</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(false)} disabled={actionLoading}>Keep Plan</Button>
            <Button variant="destructive" onClick={handleCancelConfirm} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialog} onOpenChange={setRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Refund</DialogTitle>
            <DialogDescription>
              Request a refund for transaction <code className="bg-muted px-1 rounded text-xs">{refundTxn?.gateway_order_id}</code> of ₹{Number(refundTxn?.amount || 0).toLocaleString("en-IN")}.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            <p className="font-medium mb-1">Refund Policy</p>
            <ul className="space-y-1">
              <li>• Refunds are processed within 5-7 business days</li>
              <li>• Amount will be credited to original payment method</li>
              <li>• Your subscription will be cancelled upon refund</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRefundDialog(false); setRefundTxn(null); }} disabled={actionLoading}>Cancel</Button>
            <Button variant="default" onClick={handleRefundRequest} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Submit Refund Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Downgrade Dialog */}
      <Dialog open={downgradeDialog} onOpenChange={setDowngradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Downgrade to {downgradePlan?.name}</DialogTitle>
            <DialogDescription>
              You're switching from <strong>{currentPlan?.name}</strong> to <strong>{downgradePlan?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Plan</span>
                <span className="font-medium text-foreground">{currentPlan?.name} — ₹{(subscription?.billing_cycle === "yearly" ? currentPlan?.price_yearly : currentPlan?.price_monthly)?.toLocaleString("en-IN")}/{subscription?.billing_cycle === "yearly" ? "yr" : "mo"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New Plan</span>
                <span className="font-medium text-foreground">{downgradePlan?.name} — {downgradePlan?.price_monthly === 0 ? "Free" : `₹${(subscription?.billing_cycle === "yearly" ? downgradePlan?.price_yearly : downgradePlan?.price_monthly)?.toLocaleString("en-IN")}/${subscription?.billing_cycle === "yearly" ? "yr" : "mo"}`}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="text-muted-foreground">Prorated Credit</span>
                <span className="font-semibold text-green-600">~₹{calculateProratedCredit().toLocaleString("en-IN")}</span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              <Info className="h-3.5 w-3.5 inline mr-1" />
              The prorated credit will be applied to your next billing cycle. Your plan will change immediately.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDowngradeDialog(false); setDowngradePlan(null); }} disabled={actionLoading}>Keep Current Plan</Button>
            <Button variant="default" onClick={handleDowngradeConfirm} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Confirm Downgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SubscriptionManagement;
