import { fireEvent, render } from "@testing-library/react-native";

import { FocusedPickRow } from "../SearchResultRows";

jest.mock("lucide-react-native", () => ({
  Star: () => null,
}));

jest.mock("../../components/MobileUI", () => ({
  ProductImageFrame: () => null,
  cx: (...classes) => classes.filter(Boolean).join(" "),
}));

const baseItem = {
  title: "Ergonomic Office Chair",
  price: "$249.99",
  rating: 4.5,
  reviewCount: 1234,
  image: "https://example.com/chair.jpg",
  fit_reason: "Great lumbar support for long sessions",
  feature_bullets: ["Adjustable armrests", "Mesh back"],
};

describe("FocusedPickRow", () => {
  it("renders the product title and fit reason", () => {
    const { getByText } = render(
      <FocusedPickRow item={baseItem} index={0} onPress={jest.fn()} />,
    );

    expect(getByText("Ergonomic Office Chair")).toBeTruthy();
    expect(getByText("Great lumbar support for long sessions")).toBeTruthy();
  });

  it("renders price, rating, and review count", () => {
    const { getByText } = render(
      <FocusedPickRow item={baseItem} index={0} onPress={jest.fn()} />,
    );

    expect(getByText("$249.99")).toBeTruthy();
    expect(getByText("4.5 rating")).toBeTruthy();
    expect(getByText("1234 reviews")).toBeTruthy();
  });

  it("shows 'Price not shown' when price is missing", () => {
    const item = { ...baseItem, price: null };
    const { getByText } = render(
      <FocusedPickRow item={item} index={0} onPress={jest.fn()} />,
    );

    expect(getByText("Price not shown")).toBeTruthy();
  });

  it("shows 'Rating not shown' for null rating", () => {
    const item = { ...baseItem, rating: null };
    const { getByText } = render(
      <FocusedPickRow item={item} index={0} onPress={jest.fn()} />,
    );

    expect(getByText("Rating not shown")).toBeTruthy();
  });

  it("shows 'Rating not shown' for empty string rating", () => {
    const item = { ...baseItem, rating: "" };
    const { getByText } = render(
      <FocusedPickRow item={item} index={0} onPress={jest.fn()} />,
    );

    expect(getByText("Rating not shown")).toBeTruthy();
  });

  it("shows 'Rating not shown' for boolean rating", () => {
    const item = { ...baseItem, rating: true };
    const { getByText } = render(
      <FocusedPickRow item={item} index={0} onPress={jest.fn()} />,
    );

    expect(getByText("Rating not shown")).toBeTruthy();
  });

  it("handles string rating values", () => {
    const item = { ...baseItem, rating: "4.7 out of 5" };
    const { getByText } = render(
      <FocusedPickRow item={item} index={0} onPress={jest.fn()} />,
    );

    expect(getByText("4.7 out of 5 rating")).toBeTruthy();
  });

  it("hides review count when missing", () => {
    const item = { ...baseItem, reviewCount: null };
    const { queryByText } = render(
      <FocusedPickRow item={item} index={0} onPress={jest.fn()} />,
    );

    expect(queryByText(/reviews/)).toBeNull();
  });

  it("falls back to caveat then feature bullet then default reason", () => {
    const itemNoCaveat = { ...baseItem, fit_reason: "", caveat: "A bit heavy", feature_bullets: ["Adjustable"] };
    const { getByText: getByText1 } = render(
      <FocusedPickRow item={itemNoCaveat} index={0} onPress={jest.fn()} />,
    );
    expect(getByText1("A bit heavy")).toBeTruthy();

    const itemNoBoth = { ...baseItem, fit_reason: "", caveat: "", feature_bullets: ["Mesh back"] };
    const { getByText: getByText2 } = render(
      <FocusedPickRow item={itemNoBoth} index={0} onPress={jest.fn()} />,
    );
    expect(getByText2("Mesh back")).toBeTruthy();

    const itemNoAll = { ...baseItem, fit_reason: "", caveat: "", feature_bullets: [] };
    const { getByText: getByText3 } = render(
      <FocusedPickRow item={itemNoAll} index={0} onPress={jest.fn()} />,
    );
    expect(getByText3("A focused match for this search.")).toBeTruthy();
  });

  it("renders provider label when present", () => {
    const item = { ...baseItem, provider: "Amazon" };
    const { getByText } = render(
      <FocusedPickRow item={item} index={0} onPress={jest.fn()} />,
    );

    expect(getByText("Amazon")).toBeTruthy();
  });

  it("fires onPress callback", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <FocusedPickRow item={baseItem} index={2} onPress={onPress} />,
    );

    fireEvent.press(getByTestId("results.focusedPick.3"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("sets correct testID based on index", () => {
    const { getByTestId } = render(
      <FocusedPickRow item={baseItem} index={0} onPress={jest.fn()} />,
    );

    expect(getByTestId("results.focusedPickRow.1")).toBeTruthy();
    expect(getByTestId("results.focusedPick.1")).toBeTruthy();
  });

  it("shows 'View details' link", () => {
    const { getByText } = render(
      <FocusedPickRow item={baseItem} index={0} onPress={jest.fn()} />,
    );

    expect(getByText("View details")).toBeTruthy();
  });
});
