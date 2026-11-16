import { describe, expect, it } from "vitest";
import { tripDraftSchema } from "./trip";
const draft = {name:"Viagem",startsAt:"",endsAt:"",locationName:"",mapUrl:""};
describe("trip map URL credential safety", () => {
 it("rejects URLs with embedded credentials", () => {
  for(const mapUrl of ["https://user:password@maps.example.com/location","https://user@maps.example.com/location"]) {
   expect(tripDraftSchema.safeParse({...draft,mapUrl}).success).toBe(false);
  }
 });
 it("accepts ordinary HTTPS map links and empty values", () => {
  expect(tripDraftSchema.safeParse({...draft,mapUrl:"https://maps.google.com/?q=trip"}).success).toBe(true);
  expect(tripDraftSchema.safeParse(draft).success).toBe(true);
 });
});
