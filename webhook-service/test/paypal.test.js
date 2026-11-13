import test from "node:test";
import assert from "node:assert/strict";
import {getSignatureHeaders,validateWebhookPayload} from "../lib/paypal.js";
import {createPaypalWebhookHandler} from "../api/webhooks/paypal.js";
const env={PAYPAL_ENV:"sandbox",PAYPAL_CLIENT_ID:"test-id",PAYPAL_CLIENT_SECRET:"test-secret",PAYPAL_WEBHOOK_ID:"test-webhook"};
const event={id:"WH-TEST-1",event_type:"PAYMENT.CAPTURE.COMPLETED"};
function res(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(b){this.body=b;return this;}};}
test("validates event envelope",()=>{assert.equal(validateWebhookPayload(event),true);assert.equal(validateWebhookPayload({id:"x"}),false);assert.equal(validateWebhookPayload(null),false);});
test("maps signature headers case-insensitively",()=>{assert.equal(getSignatureHeaders({"PAYPAL-TRANSMISSION-ID":"t"}).transmission_id,"t");});
test("rejects non-POST",async()=>{const r=res();await createPaypalWebhookHandler({env})({method:"GET"},r);assert.equal(r.statusCode,405);});
test("requires Sandbox credentials",async()=>{const r=res();await createPaypalWebhookHandler({env:{PAYPAL_ENV:"sandbox"}})({method:"POST",body:event},r);assert.equal(r.statusCode,503);});
test("rejects malformed payload",async()=>{const r=res();await createPaypalWebhookHandler({env})({method:"POST",body:{id:"x"}},r);assert.equal(r.statusCode,400);});
test("rejects failed signature",async()=>{const r=res();await createPaypalWebhookHandler({env,verify:async()=>({verified:false}),log:()=>{}})({method:"POST",body:event},r);assert.equal(r.statusCode,400);});
test("accepts verified Sandbox event with log-only persistence",async()=>{const r=res();await createPaypalWebhookHandler({env,verify:async()=>({verified:true}),log:()=>{}})({method:"POST",body:event},r);assert.equal(r.statusCode,202);assert.equal(r.body.persistence,"runtime_log_only");});
test("rejects Live environment",async()=>{const r=res();await createPaypalWebhookHandler({env:{...env,PAYPAL_ENV:"live"}})({method:"POST",body:event},r);assert.equal(r.statusCode,503);});