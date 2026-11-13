export default function health(req,res) {
  if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({status:"method_not_allowed"});}
  return res.status(200).json({service:"bnhassinagent-paypal-webhook-service",status:"ok",environment:process.env.PAYPAL_ENV||"sandbox",sandbox_only:true,paypal_credentials_configured:Boolean(process.env.PAYPAL_CLIENT_ID&&process.env.PAYPAL_CLIENT_SECRET&&process.env.PAYPAL_WEBHOOK_ID),durable_event_store:false,timestamp:new Date().toISOString()});
}