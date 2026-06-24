import { hasPrimeEligibility, getDeliverySignal, isPositivePrimeFlag } from "../primeEligibility";

describe("isPositivePrimeFlag", () => {
  it("accepts positive boolean-like values only", () => {
    expect(isPositivePrimeFlag(true)).toBe(true);
    expect(isPositivePrimeFlag(1)).toBe(true);
    expect(isPositivePrimeFlag("true")).toBe(true);
    expect(isPositivePrimeFlag("yes")).toBe(true);
  });

  it("rejects falsey boolean-like values", () => {
    expect(isPositivePrimeFlag(false)).toBe(false);
    expect(isPositivePrimeFlag(0)).toBe(false);
    expect(isPositivePrimeFlag("false")).toBe(false);
    expect(isPositivePrimeFlag("no")).toBe(false);
    expect(isPositivePrimeFlag("")).toBe(false);
  });
});

describe("hasPrimeEligibility", () => {
  it("returns true for isPrime flag", () => {
    expect(hasPrimeEligibility({ isPrime: true })).toBe(true);
  });

  it("returns true for is_prime flag", () => {
    expect(hasPrimeEligibility({ is_prime: true })).toBe(true);
  });

  it("does not treat string false Prime flags as eligible", () => {
    expect(hasPrimeEligibility({ isPrime: "false" })).toBe(false);
    expect(hasPrimeEligibility({ is_prime: "false" })).toBe(false);
  });

  it("returns true for primeEligible flag", () => {
    expect(hasPrimeEligibility({ primeEligible: true })).toBe(true);
  });

  it("returns true for isPrimeEligible flag", () => {
    expect(hasPrimeEligibility({ isPrimeEligible: true })).toBe(true);
  });

  it("returns true when delivery text mentions Prime", () => {
    expect(hasPrimeEligibility({ delivery: "FREE Prime delivery" })).toBe(true);
    expect(hasPrimeEligibility({ delivery: "Arrives with Prime" })).toBe(true);
  });

  it("does not upgrade negative Prime delivery text", () => {
    expect(hasPrimeEligibility({ delivery: "Not Prime eligible" })).toBe(false);
    expect(hasPrimeEligibility({ delivery: "Prime unavailable for this item" })).toBe(false);
  });

  it("returns false when no Prime indicators are present", () => {
    expect(hasPrimeEligibility({ delivery: "FREE delivery Wed" })).toBe(false);
    expect(hasPrimeEligibility({})).toBe(false);
    expect(hasPrimeEligibility(null)).toBe(false);
  });
});

describe("getDeliverySignal", () => {
  it("returns Prime signal for Prime-eligible items", () => {
    expect(getDeliverySignal({ isPrime: true })).toEqual({
      label: "Prime",
      value: "Prime eligible",
    });
  });

  it("returns free delivery signal for free shipping text", () => {
    expect(getDeliverySignal({ delivery: "Free delivery Thursday" })).toEqual({
      label: "Free delivery",
      value: "Free delivery",
    });
    expect(getDeliverySignal({ delivery: "Free shipping on orders over $25" })).toEqual({
      label: "Free delivery",
      value: "Free delivery",
    });
  });

  it("returns null when no delivery signal is present", () => {
    expect(getDeliverySignal({ delivery: "Ships in 3-5 days" })).toBeNull();
    expect(getDeliverySignal({})).toBeNull();
    expect(getDeliverySignal(null)).toBeNull();
  });

  it("prefers Prime over free delivery when both are present", () => {
    expect(
      getDeliverySignal({ isPrime: true, delivery: "Free delivery" }),
    ).toEqual({
      label: "Prime",
      value: "Prime eligible",
    });
  });
});
