import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({member:vi.fn(),create:vi.fn(),upload:vi.fn()}));
vi.mock("@/features/members/permissions",()=>({requireTripMember:mocks.member}));
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => ({ user: { id: "user-1" } })) }));
vi.mock("@/lib/prisma",()=>({prisma:{photo:{create:mocks.create}}}));
vi.mock("@/features/photos/storage",()=>({uploadPrivatePhoto:mocks.upload,deletePrivatePhoto:vi.fn()}));
import { POST } from "./route";
const context={params:Promise.resolve({tripId:"trip-1"})};
beforeEach(()=>{vi.clearAllMocks();mocks.member.mockResolvedValue({userId:"user-1"});});
describe("photo multipart upload size enforcement",()=>{
 it("rejects oversized bodies even without Content-Length",async()=>{
  const response=await POST(new Request("http://localhost/api/trips/trip-1/photos",{
   method:"POST",headers:{"content-type":"multipart/form-data; boundary=unused"},
   body:new Uint8Array(5*1024*1024+4097),
  }),context);
  expect(response.status).toBe(413);
  expect(mocks.create).not.toHaveBeenCalled();
  expect(mocks.upload).not.toHaveBeenCalled();
 });
 it("rejects declared oversized bodies before reading",async()=>{
  const response=await POST(new Request("http://localhost/api/trips/trip-1/photos",{
   method:"POST",headers:{"content-length":String(5*1024*1024+4097)},body:"small",
  }),context);
  expect(response.status).toBe(413);
 });
 it("preserves 400 response for malformed small multipart bodies",async()=>{
  const response=await POST(new Request("http://localhost/api/trips/trip-1/photos",{
   method:"POST",headers:{"content-type":"multipart/form-data; boundary=unused"},body:"bad",
  }),context);
  expect(response.status).toBe(400);
 });
});
