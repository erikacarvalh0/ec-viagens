import { afterEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({reconcile:vi.fn()}));
vi.mock("@/features/payments/webhook",()=>({reconcileAsaasEvent:mocks.reconcile}));
import { POST } from "./route";
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
describe("Asaas webhook request size limit",()=>{
 it("rejects oversized authenticated bodies without reconciliation",async()=>{
  vi.stubEnv("ASAAS_WEBHOOK_TOKEN","secret");
  const response=await POST(new Request("http://localhost/api/webhooks/asaas",{
   method:"POST",headers:{"asaas-access-token":"secret"},
   body:JSON.stringify({payload:"x".repeat(1024*1024+1)}),
  }));
  expect(response.status).toBe(413);
  expect(mocks.reconcile).not.toHaveBeenCalled();
 });
 it("rejects advertised oversized bodies before reading",async()=>{
  vi.stubEnv("ASAAS_WEBHOOK_TOKEN","secret");
  const response=await POST(new Request("http://localhost/api/webhooks/asaas",{
   method:"POST",headers:{"asaas-access-token":"secret","content-length":String(1024*1024+1)},
   body:"{}",
  }));
  expect(response.status).toBe(413);
 });
 it("still processes small authenticated events",async()=>{
  vi.stubEnv("ASAAS_WEBHOOK_TOKEN","secret");
  mocks.reconcile.mockResolvedValue("processed");
  const response=await POST(new Request("http://localhost/api/webhooks/asaas",{
   method:"POST",headers:{"asaas-access-token":"secret"},
   body:JSON.stringify({id:"evt-1",event:"PAYMENT_RECEIVED",payment:{id:"pay-1"}}),
  }));
  expect(response.status).toBe(200);
 });
});
