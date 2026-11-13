import {validateWebhookPayload,verifyPaypalWebhook} from "../../lib/paypal.js";
export function createPaypalWebhookHandler({verify=verifyPaypalWebhook,env=process.env,log=console.log}={}) {
  return async function paypalWebhook(req,res) {
    if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({status:"method_not_allowed"});}
    if((env.PAYPAL_ENV||"sandbox")!=="sandbox")return res.status(503).json({status:"sandbox_only"});
    if(!env.PAYPAL_CLIENT_ID||!env.PAYPAL_CLIENT_SECRET||!env.PAYPAL_WEBHOOK_ID)return res.status(503).json({status:"sandbox_configuration_missing"});
    if(!validateWebhookPayload(req.body))return res.status(400).json({status:"invalid_webhook_payload"});
    try {
      const result=await verify({headers:req.headers||{},event:req.body,env});
      if(!result.verified){log(JSON.stringify({component:"paypal-webhook",action:"signature_rejected",event_id:req.body.id,event_type:req.body.event_type,reason:result.reason,environment:"sandbox"}));return res.status(400).json({status:"signature_verification_failed"});}
      log(JSON.stringify({component:"paypal-webhook",action:"event_verified_received",event_id:req.body.id,event_type:req.body.event_type,environment:"sandbox",persistence:"runtime_log_only",timestamp:new Date().toISOString()}));
      return res.status(202).json({status:"verified_received",event_id:req.body.id,event_type:req.body.event_type,persistence:"runtime_log_only",note:"Durable event storage is required before business processing."});
    } catch(error) {
      log(JSON.stringify({component:"paypal-webhook",action:"verification_error",event_id:req.body.id,event_type:req.body.event_type,environment:"sandbox",error:error instanceof Error?error.message:"unknown_error"}));
      return res.status(502).json({status:"verification_unavailable"});
    }
  };
}
export default createPaypalWebhookHandler();