import { describe, expect, it } from "vitest";

import { getTripBackLabel } from "./history";

describe("trip history navigation", () => {
  it("returns archived trips to the history section", () => {
    expect(getTripBackSection(true)).toBe("trips");
    expect(getTripBackLabel(true)).toBe("Voltar ao histórico");
  });

  it("returns active trips to the regular trip list", () => {
    expect(getTripBackSection(false)).toBe("trips");
    expect(getTripBackLabel(false)).toBe("Voltar às viagens");
  });
});
