import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// PhonePe API endpoints
const PHONEPE_SANDBOX_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";
const PHONEPE_PROD_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay";
const USE_SANDBOX = true; // Toggle for production

async function sha256Hex(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function base64Encode(obj: Record<string, unknown>): string {
  return btoa(JSON.stringify(obj));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { plan_id, billing_cycle, amount, currency, gateway } = body;

    if (!plan_id || !billing_cycle || !amount || !gateway) {
      return new Response(JSON.stringify({ error: "Missing required fields: plan_id, billing_cycle, amount, gateway" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify plan exists
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check gateway is active
    const { data: gwConfig } = await supabase
      .from("payment_gateway_config")
      .select("*")
      .eq("gateway_name", gateway)
      .eq("is_active", true)
      .single();

    if (!gwConfig) {
      return new Response(JSON.stringify({ error: "Selected payment gateway is not active" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate period end
    const now = new Date();
    const periodEnd = new Date(now);
    if (billing_cycle === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Create subscription (pending until payment confirmed)
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plan_id,
        status: "pending",
        billing_cycle,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        gateway_name: gateway,
      })
      .select()
      .single();

    if (subError) {
      return new Response(JSON.stringify({ error: "Failed to create subscription", details: subError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create unique merchant transaction ID
    const merchantTransactionId = `CVZ_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Create payment transaction record
    const { data: transaction, error: txnError } = await supabase
      .from("payment_transactions")
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        amount,
        currency: currency || "INR",
        gateway_name: gateway,
        gateway_order_id: merchantTransactionId,
        status: "pending",
        metadata: { plan_name: plan.name, billing_cycle },
      })
      .select()
      .single();

    if (txnError) {
      return new Response(JSON.stringify({ error: "Failed to create transaction" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── PhonePe Payment ───
    if (gateway === "phonepe") {
      const merchantId = Deno.env.get("PHONEPE_MERCHANT_ID");
      const saltKey = Deno.env.get("PHONEPE_SALT_KEY");
      const saltIndex = Deno.env.get("PHONEPE_SALT_INDEX") || "1";

      if (!merchantId || !saltKey) {
        return new Response(JSON.stringify({ error: "PhonePe credentials not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Build redirect URL
      // Determine role from plan target_role for redirect
      const dashRole = plan.target_role === "recruiter" ? "recruiter" : "candidate";
      const redirectUrl = `${req.headers.get("origin") || "https://cvzen.lovable.app"}/${dashRole}/billing?payment_status=success&txn_id=${merchantTransactionId}`;
      const callbackUrl = `${supabaseUrl}/functions/v1/phonepe-callback`;

      // PhonePe v1 payload (amount in paisa)
      const payload = {
        merchantId,
        merchantTransactionId,
        merchantUserId: user.id.replace(/-/g, "").slice(0, 36),
        amount: Math.round(amount * 100), // Convert to paisa
        redirectUrl,
        redirectMode: "REDIRECT",
        callbackUrl,
        paymentInstrument: {
          type: "PAY_PAGE",
        },
      };

      const base64Payload = base64Encode(payload);
      const apiEndpoint = "/pg/v1/pay";
      const stringToHash = base64Payload + apiEndpoint + saltKey;
      const sha256Hash = await sha256Hex(stringToHash);
      const xVerify = sha256Hash + "###" + saltIndex;

      const phonepeUrl = USE_SANDBOX ? PHONEPE_SANDBOX_URL : PHONEPE_PROD_URL;

      const phonepeResponse = await fetch(phonepeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerify,
        },
        body: JSON.stringify({ request: base64Payload }),
      });

      const phonepeData = await phonepeResponse.json();

      if (phonepeData.success && phonepeData.data?.instrumentResponse?.redirectInfo?.url) {
        // Update transaction with PhonePe order ID
        await supabase
          .from("payment_transactions")
          .update({
            gateway_transaction_id: phonepeData.data.merchantTransactionId,
            status: "processing",
          })
          .eq("id", transaction.id);

        return new Response(JSON.stringify({
          payment_url: phonepeData.data.instrumentResponse.redirectInfo.url,
          order_id: merchantTransactionId,
          transaction_id: transaction.id,
          gateway: "phonepe",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // Payment initiation failed
        await supabase
          .from("payment_transactions")
          .update({ status: "failed", metadata: { ...transaction.metadata, phonepe_error: phonepeData } })
          .eq("id", transaction.id);

        return new Response(JSON.stringify({
          error: "PhonePe payment initiation failed",
          details: phonepeData.message || phonepeData.code || "Unknown error",
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ─── Razorpay (placeholder) ───
    if (gateway === "razorpay") {
      return new Response(JSON.stringify({
        order_id: merchantTransactionId,
        transaction_id: transaction.id,
        gateway: "razorpay",
        message: "Razorpay integration coming soon",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Stripe (placeholder) ───
    if (gateway === "stripe") {
      return new Response(JSON.stringify({
        order_id: merchantTransactionId,
        transaction_id: transaction.id,
        gateway: "stripe",
        message: "Stripe integration coming soon",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported gateway" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Payment error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
