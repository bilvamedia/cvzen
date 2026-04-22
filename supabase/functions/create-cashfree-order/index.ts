import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CASHFREE_PROD_URL = "https://api.cashfree.com/pg/orders";
const CASHFREE_API_VERSION = "2023-08-01";

const PLANS: Record<string, { name: string; amount: number; currency: string }> = {
  pro: { name: "CVzen Pro", amount: 749, currency: "INR" },
  recruiter: { name: "CVzen Recruiter", amount: 3999, currency: "INR" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const appId = Deno.env.get("CASHFREE_APP_ID") ?? "";
    const secretKey = Deno.env.get("CASHFREE_SECRET_KEY") ?? "";

    if (!appId || !secretKey) {
      return new Response(JSON.stringify({ error: "Cashfree credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode JWT to get user_id (never use getUser() in edge functions)
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing authorization token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode JWT payload (base64url)
    let userId: string;
    let userEmail: string;
    let userName: string;
    try {
      const parts = token.split(".");
      if (parts.length < 2) throw new Error("Invalid JWT");
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      userId = payload.sub;
      userEmail = payload.email ?? "";
      userName = payload.user_metadata?.full_name ?? payload.email ?? "CVzen User";
    } catch {
      return new Response(JSON.stringify({ error: "Invalid authorization token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const planKey = (body.plan ?? "").toLowerCase();

    const plan = PLANS[planKey];
    if (!plan) {
      return new Response(JSON.stringify({ error: `Invalid plan: ${planKey}. Valid plans: pro, recruiter` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create unique order ID
    const orderId = `cvzen_${planKey}_${userId.slice(0, 8)}_${Date.now()}`;

    // Create Cashfree order
    const cashfreePayload = {
      order_id: orderId,
      order_amount: plan.amount,
      order_currency: plan.currency,
      customer_details: {
        customer_id: userId,
        customer_email: userEmail,
        customer_name: userName,
        customer_phone: body.phone ?? "9999999999",
      },
      order_meta: {
        notify_url: `${supabaseUrl}/functions/v1/cashfree-webhook`,
      },
      order_note: `${plan.name} subscription`,
    };

    const cfRes = await fetch(CASHFREE_PROD_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": CASHFREE_API_VERSION,
        "x-client-id": appId,
        "x-client-secret": secretKey,
      },
      body: JSON.stringify(cashfreePayload),
    });

    const cfData = await cfRes.json();

    if (!cfRes.ok) {
      console.error("Cashfree order creation failed:", cfData);
      return new Response(JSON.stringify({ error: cfData.message ?? "Failed to create payment order" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentSessionId: string = cfData.payment_session_id;

    // Create subscription record (pending)
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan: planKey,
        status: "pending",
        amount: plan.amount,
        currency: plan.currency,
        cashfree_order_id: orderId,
        gateway_name: "cashfree",
        billing_cycle: "monthly",
        current_period_start: now.toISOString(),
        current_period_end: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (subError) {
      console.error("Failed to create subscription:", subError);
    }

    // Record payment transaction
    if (sub?.id) {
      const { error: txnError } = await supabase.from("payment_transactions").insert({
        user_id: userId,
        subscription_id: sub.id,
        amount: plan.amount,
        currency: plan.currency,
        status: "pending",
        gateway_name: "cashfree",
        gateway_order_id: orderId,
        metadata: { plan: planKey, cashfree_response: cfData },
      });

      if (txnError) {
        console.error("Failed to create payment transaction:", txnError);
      }
    }

    return new Response(
      JSON.stringify({
        payment_session_id: paymentSessionId,
        order_id: orderId,
        amount: plan.amount,
        currency: plan.currency,
        plan: planKey,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("create-cashfree-order error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
