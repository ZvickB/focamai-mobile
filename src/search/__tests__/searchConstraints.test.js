import { buildConstraintRefreshQuery, detectHardConstraint } from "../searchConstraints";

describe("detectHardConstraint", () => {
  it.each([
    ["kosher cookies", "jewish_kosher", "kosher"],
    ["must be pareve", "jewish_kosher", "pareve"],
    ["parve chocolate chips", "jewish_kosher", "parve"],
    ["cholov yisroel cheese", "jewish_kosher", "cholov yisroel"],
    ["chalav yisrael snacks", "jewish_kosher", "chalav yisrael"],
    ["for shabbos", "jewish_kosher", "shabbos"],
    ["for shabbat", "jewish_kosher", "shabbat"],
    ["non-dairy white chocolate", "dietary_allergy", "non dairy"],
    ["non dairy white chocolate", "dietary_allergy", "non dairy"],
    ["nondairy white chocolate", "dietary_allergy", "non dairy"],
    ["dairyfree white chocolate", "dietary_allergy", "dairy free"],
    ["gluten-free pasta", "dietary_allergy", "gluten free"],
    ["gluten free pasta", "dietary_allergy", "gluten free"],
    ["glutenfree pasta", "dietary_allergy", "gluten free"],
    ["BPA-free bottle", "safety_material", "bpa free"],
    ["no scented coating", "compatibility_exclusion", "no"],
  ])("detects %s", (text, category, matchedTerm) => {
    expect(detectHardConstraint(text)).toEqual({
      category,
      matchedTerm,
      shouldRefresh: true,
    });
  });

  it("does not refresh for ordinary soft preferences", () => {
    expect(detectHardConstraint("something cute and affordable")).toEqual({
      category: "",
      matchedTerm: "",
      shouldRefresh: false,
    });
  });
});

describe("buildConstraintRefreshQuery", () => {
  it("combines the original query and follow-up notes with normalized spacing", () => {
    expect(buildConstraintRefreshQuery("white chocolate chips", "  kosher   pareve ")).toBe(
      "white chocolate chips kosher pareve",
    );
  });
});
