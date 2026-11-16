import { afterEach, describe, expect, it, vi } from "vitest";
import { createAsaasCustomer, findAsaasPaymentByReference } from "./asaas";
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe("Asaas request deadlines",()=>{
 it("sets a timeout on customer creation",async()=>{
  vi.stubEnv("ASAAS_API_KEY","test-key");
  const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({id:"customer-1"})});
  vi.stubGlobal("fetch",fetchMock);
  await createAsaasCustomer({name:"Ana",email:"ana@example.com"});
  expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
 });
 it("sets a timeout on payment recovery lookup",async()=>{
  vi.stubEnv("ASAAS_API_KEY","test-key");
  const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({data:[]})});
  vi.stubGlobal("fetch",fetchMock);
  await findAsaasPaymentByReference("charge-1");
  expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
 });
 it("does not leak transport errors from customer creation",async()=>{
  vi.stubEnv("ASAAS_API_KEY","test-key");
  vi.stubGlobal("fetch",vi.fn().mockRejectedValue(new Error("private network details")));
  await expect(createAsaasCustomer({name:"Ana",email:"ana@example.com"})).rejects.toThrow("Asaas API request failed.");
 });
 it("does not leak transport errors from recovery lookup",async()=>{
  vi.stubEnv("ASAAS_API_KEY","test-key");
  vi.stubGlobal("fetch",vi.fn().mockRejectedValue(new Error("private network details")));
  await expect(findAsaasPaymentByReference("charge-1")).rejects.toThrow("Asaas payment lookup failed.");
 });
});
