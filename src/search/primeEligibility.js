export function hasPrimeEligibility(item) {
  const deliveryText = String(item?.delivery || "");

  return Boolean(
    item?.isPrime ||
    item?.is_prime ||
    item?.primeEligible ||
    item?.isPrimeEligible ||
    /\bprime\b/i.test(deliveryText),
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
