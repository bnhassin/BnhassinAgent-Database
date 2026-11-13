const API = "https://api-m.sandbox.paypal.com";
export function getSignatureHeaders(headers = {}) {
  const h = Object.fromEntries(Object.entries(headers).map(([k,v]) => [k.toLowerCase(),v]));
  return {auth_algo:h["paypal-auth-algo"],cert_url:h["paypal-cert-url"],transmission_id:h["paypal-transmission-id"],transmission_sig:h["paypal-transmission-sig"],transmission_time:h["paypal-transmission-time"]};
}
export function validateWebhookPayload(body) {
  return Boolean(body && typeof body === "object" && !Array.isArray(body) && typeof body.id === "string" && body.id && typeof body.event_type === "string" && body.event_type);
}
export async function verifyPaypalWebhook({headers,event,env=process.env}) {
  if ((env.PAYPAL_ENV || "sandbox") !== "sandbox") throw new Error("Sandbox-only service");
  const {PAYPAL_CLIENT_ID:id,PAYPAL_CLIENT_SECRET:secret,PAYPAL_WEBHOOK_ID:webhookId}=env;
  if (!id || !secret || !webhookId) throw new Error("Sandbox credentials missing");
  const signature=getSignatureHeaders(headers);
  if (Object.values(signature).some(v=>typeof v!=="string" || !v)) return {verified:false,reason:"missing_signature_headers"};
  const tokenResponse=await fetch(API+"/v1/oauth2/token",{method:"POST",headers:{Authorization:"Basic "+Buffer.from(id+":"+secret).toString("base64"),"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=client_credentials",signal:AbortSignal.timeout(10000)});
  if (!tokenResponse.ok) throw new Error("PayPal OAuth HTTP "+tokenResponse.status);
  const token=(await tokenResponse.json()).access_token;
  if (!token) throw new Error("PayPal OAuth token missing");
  const response=await fetch(API+"/v1/notifications/verify-webhook-signature",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({...signature,webhook_id:webhookId,webhook_event:event}),signal:AbortSignal.timeout(10000)});
  if (!response.ok) throw new Error("PayPal verification HTTP "+response.status);
  const result=await response.json();
  return {verified:result.verification_status==="SUCCESS",reason:result.verification_status==="SUCCESS"?"verified":"signature_verification_failed"};
}