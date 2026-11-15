import { describe, expect, it } from "vitest";

import { paymentPlanSchema } from "./schema";

describe("payment plan validation", () => {
  it("accepts a valid plan with a due day", () => {
    const result = paymentPlanSchema.parse({
      name: "Parcela mensal",
      amount: "125.50",
      dueDay: "10",
    });

    expect(result.amountCents).toBe(12550);
    expect(result.dueDay).toBe(10);
  });

  it("accepts plans without a recurring due day", () => {
    const result = paymentPlanSchema.parse({
      name: "Taxa única",
      amount: "50",
      dueDay: "",
    });

    expect(result.dueDay).toBeNull();
  });

  it.each(["0", "-10", "abc", "10.999", "10000000"])(
    "rejects invalid amount %s",
    (amount) => {
      expect(
        paymentPlanSchema.safeParse({
          name: "Parcela",
          amount,
          dueDay: "5",
        }).success,
      ).toBe(false);
    },
  );

  it.each(["0", "29", "31", "abc"])(
    "rejects invalid due day %s",
    (dueDay) => {
      expect(
        paymentPlanSchema.safeParse({
          name: "Parcela",
          amount: "100",
          dueDay,
        }).success,
      ).toBe(false);
    },
  );
});
