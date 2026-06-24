import { formatDisplayPrice } from "../formatDisplayPrice";

describe("formatDisplayPrice", () => {
  it("formats numeric prices to two decimals while preserving currency text", () => {
    expect(formatDisplayPrice("$19")).toBe("$19.00");
    expect(formatDisplayPrice("CAD 1,299.5")).toBe("CAD 1,299.50");
    expect(formatDisplayPrice("from $24.999 each")).toBe("from $25.00 each");
  });

  it("leaves non-numeric price labels unchanged", () => {
    expect(formatDisplayPrice("Price unavailable")).toBe("Price unavailable");
    expect(formatDisplayPrice("")).toBe("");
    expect(formatDisplayPrice(null)).toBe("");
  });

  it("handles integer prices without decimals", () => {
    expect(formatDisplayPrice("$100")).toBe("$100.00");
    expect(formatDisplayPrice("€50")).toBe("€50.00");
  });

  it("handles prices with commas in thousands", () => {
    expect(formatDisplayPrice("$1,299")).toBe("$1,299.00");
    expect(formatDisplayPrice("$12,500.99")).toBe("$12,500.99");
  });

  it("handles undefined and non-string inputs gracefully", () => {
    expect(formatDisplayPrice(undefined)).toBe("");
    expect(formatDisplayPrice(0)).toBe("");
    expect(formatDisplayPrice(false)).toBe("");
    expect(formatDisplayPrice(42.5)).toBe("42.50");
  });

  it("preserves surrounding text around the numeric value", () => {
    expect(formatDisplayPrice("Starting at $29 USD")).toBe("Starting at $29.00 USD");
    expect(formatDisplayPrice("~$199")).toBe("~$199.00");
  });

  it("handles price ranges by formatting the first number", () => {
    expect(formatDisplayPrice("$10 - $20")).toBe("$10.00 - $20");
  });
});
