// Dev-only mock data for DevLauncherScreen.
// Never imported in production — all callers are guarded by __DEV__.

export const MOCK_PRODUCT_QUERY = "ergonomic office chair for long work sessions";

export const MOCK_REFINEMENT_PROMPT = {
  followUpPlaceholder: "Add budget, size, must-haves, dealbreakers, or how you plan to use it.",
  helperText: "The more context you give, the better the picks.",
  prompt: "What matters most for how you'll use this chair?",
  suggestedRefinements: ["Under $400", "Lumbar support", "Mesh backrest", "Adjustable armrests"],
  timingMs: 320,
};

export const MOCK_FINAL_RESULTS = [
  {
    id: "dev-1",
    title: "Herman Miller Aeron Chair — Size B",
    image: null,
    price: "$1,395",
    rating: 4.6,
    fit_reason:
      "Built for all-day sitting with adaptive lumbar support and a forward tilt that suits desk-heavy work.",
    caveat:
      "Well above the $400–600 budget most people have in mind. Size B fits most adults but check the sizing chart — Size A and C exist for a reason.",
    feature_bullets: [
      "PostureFit SL supports both sacrum and lumbar",
      "8Z Pellicle mesh distributes weight evenly",
      "Forward tilt for active sitting postures",
    ],
    link: "https://example.com/aeron",
    provider: "Herman Miller",
  },
  {
    id: "dev-2",
    title: "Steelcase Leap V2",
    image: null,
    price: "$1,150",
    rating: 4.5,
    fit_reason:
      "Adapts to how you move throughout the day rather than locking you into one position — good if you shift posture often.",
    caveat:
      "Pricier than most budget picks. The armrests are not as quick to adjust as on some competitors.",
    feature_bullets: [
      "LiveBack technology mirrors spine movement",
      "Natural glide system for leaning forward",
      "Lower back firmness control",
    ],
    link: "https://example.com/leap",
    provider: "Steelcase",
  },
  {
    id: "dev-3",
    title: "Branch Ergonomic Chair",
    image: null,
    price: "$329",
    rating: 4.3,
    fit_reason:
      "Best value in the $300–400 range with adjustable lumbar and solid out-of-box comfort.",
    caveat:
      "Mesh quality is noticeably lower than the premium picks above. May feel less supportive after long daily sessions.",
    feature_bullets: [
      "Adjustable lumbar support",
      "4D armrests",
      "Breathable mesh backrest",
    ],
    link: "https://example.com/branch",
    provider: "Branch",
  },
  {
    id: "dev-4",
    title: "Secretlab Titan Evo 2022",
    image: null,
    price: "$449",
    rating: 4.4,
    fit_reason:
      "Better lumbar support than most gaming chairs; holds up well for desk work if you can overlook the aesthetic.",
    caveat:
      "It's still a gaming chair — the look may feel out of place in a professional office.",
    feature_bullets: [
      "Integrated magnetic lumbar pillow",
      "Cold-cure foam seat",
      "Reclines to 165 degrees",
    ],
    link: "https://example.com/secretlab",
    provider: "Secretlab",
  },
  {
    id: "dev-5",
    title: "Autonomous ErgoChair Pro",
    image: null,
    price: "$499",
    rating: 4.1,
    fit_reason:
      "Fully adjustable with a recline lock — good for users who want fine-grained control over every position.",
    caveat:
      "Assembly is time-consuming. Customer support reviews are mixed — factor that in if something goes wrong.",
    feature_bullets: [
      "Adjustable back angle and recline lock",
      "Mesh back and seat",
      "Adjustable headrest included",
    ],
    link: "https://example.com/ergochair",
    provider: "Autonomous",
  },
  {
    id: "dev-6",
    title: "Humanscale Freedom Chair",
    image: null,
    price: "$1,195",
    rating: 4.5,
    fit_reason:
      "Self-adjusting recline and pivoting headrest make it ideal if you shift positions frequently and prefer not to fiddle with levers.",
    caveat:
      "Fewer manual adjustments than the Aeron or Leap. If you prefer dialing in every setting yourself, this chair may frustrate you.",
    feature_bullets: [
      "Weight-sensitive recline — no levers needed",
      "Pivoting headrest",
      "Form-sensing mesh seat",
    ],
    link: "https://example.com/freedom",
    provider: "Humanscale",
  },
];

export const MOCK_DISCOVERY_SUMMARY = {
  amazonDomain: "amazon.com",
  candidateCount: 24,
  candidatePool: null,
  discoveryToken: "dev-token-abc123",
  previewCount: 6,
  previewItems: MOCK_FINAL_RESULTS.slice(0, 3).map((item) => ({
    id: item.id,
    image: null,
    price: item.price,
    title: item.title,
  })),
  query: MOCK_PRODUCT_QUERY,
  source: "dev",
  timingMs: 412,
};
