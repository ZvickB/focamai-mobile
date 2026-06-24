export function isPositivePrimeFlag(value) {
  if (value === true) return true;
  if (typeof value === "number") return value === 1;
  if (typeof value !== "string") return false;

  return /^(true|yes|y|1)$/i.test(value.trim());
}

function deliveryTextConfirmsPrime(deliveryText) {
  if (!/\bprime\b/i.test(deliveryText)) {
    return false;
  }

  return !/\b(no|not|non|without|unavailable|ineligible|not eligible)\b[^.]*\bprime\b/i.test(deliveryText) &&
    !/\bprime\b[^.]*\b(unavailable|ineligible|not eligible)\b/i.test(deliveryText);
}

export function hasPrimeEligibility(item) {
  const deliveryText = String(item?.delivery || "");

  return Boolean(
    isPositivePrimeFlag(item?.isPrime) ||
    isPositivePrimeFlag(item?.is_prime) ||
    isPositivePrimeFlag(item?.primeEligible) ||
    isPositivePrimeFlag(item?.isPrimeEligible) ||
    deliveryTextConfirmsPrime(deliveryText),
  );
}

export function getDeliverySignal(item) {
  if (hasPrimeEligibility(item)) {
    return {
      label: "Prime",
      value: "Prime eligible",
    };
  }

  const deliveryText = String(item?.delivery || "");

  if (/\bfree\s+(delivery|shipping)\b/i.test(deliveryText)) {
    return {
      label: "Free delivery",
      value: "Free delivery",
    };
  }

  return null;
}
