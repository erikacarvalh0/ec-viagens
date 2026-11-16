import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({reconcile:vi.fn()}));
vi.mock("@/features/notifications/delivery",()=>({reconcileWhatsAppStatuses:mocks.reconcile}));
import { POST } from "./route";
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
describe("WhatsApp webhook body size protection",()=>{
 it("rejects oversized callback bodies before reconciliation",async()=>{
  vi.stubEnv("WHATSAPP_APP_SECRET","secret");
  const body=JSON.stringify({payload:"x".repeat(1024*1024+1)});
  const signature=createHmac("sha256","secret").update(body).digest("hex");
  const response=await POST(new Request("http://localhost/api/webhooks/whatsapp",{
   method:"POST",headers:{"x-hub-signature-256":`sha256=${signature}`},body,
  }));
  expect(response.status).toBe(413);
  expect(mocks.reconcile).not.toHaveBeenCalled();
 });
 it("rejects declared oversized callbacks without parsing",async()=>{
  vi.stubEnv("WHATSAPP_APP_SECRET","secret");
  const response=await POST(new Request("http://localhost/api/webhooks/whatsapp",{
   method:"POST",headers:{"content-length":String(1024*1024+1)},body:"{}",
  }));
  expect(response.status).toBe(413);
 });
 it("accepts correctly signed callbacks under the limit",async()=>{
  vi.stubEnv("WHATSAPP_APP_SECRET","secret");
  mocks.reconcile.mockResolvedValue(0);
  const body=JSON.stringify({entry:[]});
  const signature=createHmac("sha256","secret").update(body).digest("hex");
  const response=await POST(new Request("http://localhost/api/webhooks/whatsapp",{
   method:"POST",headers:{"x-hub-signature-256":`sha256=${signature}`},body,
  }));
  expect(response.status).toBe(200);
 });
});
