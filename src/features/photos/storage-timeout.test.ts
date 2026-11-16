import { afterEach, describe, expect, it, vi } from "vitest";
import { uploadPrivatePhoto } from "./storage";
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe("private gallery storage request deadlines",()=>{
 it("bounds S3 uploads with an abort signal",async()=>{
  vi.stubEnv("S3_BUCKET","gallery-test");
  vi.stubEnv("S3_REGION","us-east-1");
  vi.stubEnv("S3_ACCESS_KEY_ID","access");
  vi.stubEnv("S3_SECRET_ACCESS_KEY","secret");
  const fetchMock=vi.fn().mockResolvedValue({ok:true,status:200});
  vi.stubGlobal("fetch",fetchMock);
  await uploadPrivatePhoto("trips/trip-1/photo.jpg",new Uint8Array([1,2,3]),"image/jpeg");
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
 });
 it("does not expose storage credentials on network failure",async()=>{
  vi.stubEnv("S3_BUCKET","gallery-test");
  vi.stubEnv("S3_REGION","us-east-1");
  vi.stubEnv("S3_ACCESS_KEY_ID","access");
  vi.stubEnv("S3_SECRET_ACCESS_KEY","secret");
  vi.stubGlobal("fetch",vi.fn().mockRejectedValue(new Error("secret: upstream failure")));
  await expect(uploadPrivatePhoto("trips/trip-1/photo.jpg",new Uint8Array([1]),"image/jpeg")).rejects.toThrow("S3 request failed.");
 });
});
