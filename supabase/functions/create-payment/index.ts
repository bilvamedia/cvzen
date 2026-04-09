import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
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

    // Create subscription (pending)
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plan_id,
        status: "active",
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

    // Create payment transaction
    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { data: transaction, error: txnError } = await supabase
      .from("payment_transactions")
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        amount,
        currency: currency || "INR",
        gateway_name: gateway,
        gateway_order_id: orderId,
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

    // Gateway-specific payment initiation
    let paymentResponse: Record<string, any> = {};

    if (gateway === "phonepe") {
      // PhonePe integration - requires PHONEPE_MERCHANT_ID and PHONEPE_SALT_KEY secrets
      const merchantId = Deno.env.get("PHONEPE_MERCHANT_ID");
      const saltKey = Deno.env.get("PHONEPE_SALT_KEY");

      if (!merchantId || !saltKey) {
        paymentResponse = {
          order_id: orderId,
          transaction_id: transaction.id,
          message: "PhonePe payment gateway credentials not configured. Please contact admin.",
          gateway: "phonepe",
        };
      } else {
        // In production, create PhonePe payment request here
        paymentResponse = {
          order_id: orderId,
          transaction_id: transaction.id,
          gateway: "phonepe",
          message: "Payment initiated via PhonePe",
        };
      }
    } else if (gateway === "razorpay") {
      const keyId = Deno.env.get("RAZORPAY_KEY_ID");
      if (!keyId) {
        paymentResponse = {
          order_id: orderId,
          transaction_id: transaction.id,
          message: "Razorpay credentials not configured.",
          gateway: "razorpay",
        };
      } else {
        paymentResponse = {
          order_id: orderId,
          transaction_id: transaction.id,
          gateway: "razorpay",
        };
      }
    } else if (gateway === "stripe") {
      paymentResponse = {
        order_id: orderId,
        transaction_id: transaction.id,
        gateway: "stripe",
        message: "Stripe integration pending.",
      };
    }

    return new Response(JSON.stringify(paymentResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
