import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyCashfreeSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  secretKey: string,
): Promise<boolean> {
  const signatureData = timestamp + rawBody;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signatureData));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return computed === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const secretKey = Deno.env.get("CASHFREE_SECRET_KEY") ?? "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.text();
    const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
    const signature = req.headers.get("x-webhook-signature") ?? "";

    // Verify webhook signature (skip if no signature — dev/test)
    if (signature && timestamp && secretKey) {
      const isValid = await verifyCashfreeSignature(rawBody, timestamp, signature, secretKey);
      if (!isValid) {
        console.error("Cashfree webhook signature verification failed");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = JSON.parse(rawBody);
    console.log("Cashfree webhook received:", JSON.stringify(body));

    const { data: eventData, type: eventType } = body;

    const order = eventData?.order;
    const payment = eventData?.payment;
    const orderId = order?.order_id;

    if (!orderId) {
      return new Response(JSON.stringify({ error: "No order ID in payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map Cashfree event/status to internal status
    let newStatus: string;
    const orderStatus = order?.order_status ?? payment?.payment_status;

    switch (orderStatus) {
      case "PAID":
        newStatus = "completed";
        break;
      case "ACTIVE":
        newStatus = "processing";
        break;
      case "EXPIRED":
      case "TERMINATED":
      case "CANCELLED":
        newStatus = "failed";
        break;
      default:
        newStatus = "pending";
    }

    // Update payment_transactions
    const { error: txnError } = await supabase
      .from("payment_transactions")
      .update({
        status: newStatus,
        gateway_transaction_id:
          payment?.cf_payment_id?.toString() ?? order?.cf_order_id?.toString() ?? orderId,
        metadata: { cashfree_webhook: body },
      })
      .eq("gateway_order_id", orderId);

    if (txnError) {
      console.error("Failed to update payment transaction:", txnError);
    }

    // Get linked subscription
    const { data: txn } = await supabase
      .from("payment_transactions")
      .select("subscription_id")
      .eq("gateway_order_id", orderId)
      .single();

    if (txn?.subscription_id) {
      if (newStatus === "completed") {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            started_at: now.toISOString(),
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
          .eq("id", txn.subscription_id);
      } else if (newStatus === "failed") {
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("id", txn.subscription_id);
      }
    } else {
      // Fallback: update subscription directly via cashfree_order_id
      if (newStatus === "completed") {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            started_at: now.toISOString(),
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
          .eq("cashfree_order_id", orderId);
      } else if (newStatus === "failed") {
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("cashfree_order_id", orderId);
      }
    }

    return new Response(JSON.stringify({ success: true, status: newStatus }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("cashfree-webhook error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
