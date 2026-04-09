import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sha256Hex(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  // PhonePe sends callback as POST with JSON body
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const saltKey = Deno.env.get("PHONEPE_SALT_KEY")!;
    const saltIndex = Deno.env.get("PHONEPE_SALT_INDEX") || "1";

    const body = await req.json();
    const { response: encodedResponse } = body;

    if (!encodedResponse) {
      return new Response(JSON.stringify({ error: "No response payload" }), { status: 400 });
    }

    // Decode the base64 response
    const decodedResponse = JSON.parse(atob(encodedResponse));
    console.log("PhonePe callback:", JSON.stringify(decodedResponse));

    const { code, data } = decodedResponse;
    const merchantTransactionId = data?.merchantTransactionId;

    if (!merchantTransactionId) {
      return new Response(JSON.stringify({ error: "No transaction ID" }), { status: 400 });
    }

    // Verify checksum
    const verifyString = `/pg/v1/status/${Deno.env.get("PHONEPE_MERCHANT_ID")}/${merchantTransactionId}${saltKey}`;
    const expectedChecksum = await sha256Hex(verifyString) + "###" + saltIndex;

    // Update transaction status
    const newStatus = code === "PAYMENT_SUCCESS" ? "completed" : "failed";

    const { error: txnError } = await supabase
      .from("payment_transactions")
      .update({
        status: newStatus,
        gateway_transaction_id: data?.transactionId || merchantTransactionId,
        metadata: { phonepe_response: decodedResponse },
      })
      .eq("gateway_order_id", merchantTransactionId);

    if (txnError) {
      console.error("Failed to update transaction:", txnError);
    }

    // If payment succeeded, ensure subscription is active
    if (newStatus === "completed") {
      const { data: txn } = await supabase
        .from("payment_transactions")
        .select("subscription_id")
        .eq("gateway_order_id", merchantTransactionId)
        .single();

      if (txn?.subscription_id) {
        await supabase
          .from("subscriptions")
          .update({ status: "active" })
          .eq("id", txn.subscription_id);
      }
    } else {
      // Payment failed - cancel subscription
      const { data: txn } = await supabase
        .from("payment_transactions")
        .select("subscription_id")
        .eq("gateway_order_id", merchantTransactionId)
        .single();

      if (txn?.subscription_id) {
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("id", txn.subscription_id);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("PhonePe callback error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
