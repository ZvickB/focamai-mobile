import { fireEvent, render, waitFor } from "@testing-library/react-native";

import DeepDiveScreen from "../DeepDiveScreen";
import { useAuth } from "../../contexts/useAuth";
import { fetchProductDeepDive } from "../../search/searchApi";
import { useSearchFlow } from "../../search/SearchFlowContext";

jest.mock("../../contexts/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("../../search/SearchFlowContext", () => ({ useSearchFlow: jest.fn() }));
jest.mock("../../search/searchApi", () => ({ fetchProductDeepDive: jest.fn() }));

const item = {
  id: "candidate-1",
  image: "",
  price: "$199",
  provider: "Amazon",
  title: "Compact Travel Stroller",
};

function renderScreen({ amazonDomain = "amazon.com" } = {}) {
  useAuth.mockReturnValue({
    session: { access_token: "session-token" },
    user: { id: "user-1" },
  });
  useSearchFlow.mockReturnValue({
    activeSearchSession: {
      amazonDomain,
      discoveryToken: "token-1",
      submittedQuery: "travel stroller",
    },
    finalResults: [item],
  });

  return render(
    <DeepDiveScreen
      navigation={{ goBack: jest.fn() }}
      route={{ params: { candidateId: "candidate-1" } }}
    />,
  );
}

describe("DeepDiveScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders verified lower offers from an explicit request", async () => {
    fetchProductDeepDive.mockResolvedValue({
      status: "ready",
      offers: [{
        retailer: "Example Store",
        knownTotal: 179,
        currency: "USD",
        savingsVsAmazon: { amount: 20 },
        url: "https://example.com/product",
        caveats: [],
      }],
    });

    const { getByText } = renderScreen();

    await waitFor(() => expect(getByText("Example Store")).toBeTruthy());
    expect(getByText("Saves $20.00")).toBeTruthy();
    expect(getByText("Compare prices at other stores")).toBeTruthy();
    expect(fetchProductDeepDive).toHaveBeenCalledWith(expect.objectContaining({
      candidateId: "candidate-1",
      discoveryToken: "token-1",
      token: "session-token",
    }));
  });

  it("offers a separate USD fallback when Canada has no lower offers", async () => {
    fetchProductDeepDive
      .mockResolvedValueOnce({ status: "ready", offers: [] })
      .mockResolvedValueOnce({
        status: "ready",
        offers: [{ retailer: "US Store", knownTotal: 150, currency: "USD", url: "https://example.com" }],
      });

    const { getByText } = renderScreen({ amazonDomain: "amazon.ca" });
    await waitFor(() => expect(getByText("Show US retailer prices")).toBeTruthy());
    fireEvent.press(getByText("Show US retailer prices"));
    await waitFor(() => expect(getByText("US store offers (USD)")).toBeTruthy());
    expect(fetchProductDeepDive).toHaveBeenLastCalledWith(expect.objectContaining({
      crossMarketFallback: true,
    }));
  });

  it("shows verified-difference similar options even when Canada can fall back to US stores", async () => {
    fetchProductDeepDive.mockResolvedValue({
      status: "ready",
      offers: [],
      similarAlternatives: [{
        title: "Compact Travel Stroller, 2-seat version",
        difference: "2-seat version instead of 1-seat version",
        price: 249,
        currency: "CAD",
        url: "https://shopping.google.com/product/example",
      }],
    });

    const { getByText } = renderScreen({ amazonDomain: "amazon.ca" });

    await waitFor(() => expect(getByText("Other options to consider")).toBeTruthy());
    expect(getByText("Show US retailer prices")).toBeTruthy();
    expect(getByText("Compact Travel Stroller, 2-seat version")).toBeTruthy();
    expect(getByText("2-seat version instead of 1-seat version")).toBeTruthy();
    expect(getByText("$249.00")).toBeTruthy();
    expect(getByText("View in Google Shopping")).toBeTruthy();
  });

  it("explains that fallback options are not an exact price comparison", async () => {
    fetchProductDeepDive.mockResolvedValue({
      status: "similar_only",
      offers: [],
      similarAlternatives: [{
        title: "Different-brand travel stroller",
        difference: "Different model or brand",
        price: 189,
        currency: "USD",
        url: "https://shopping.google.com/product/different-brand",
      }],
    });

    const { getByText, queryByText } = renderScreen();

    await waitFor(() => expect(getByText("Couldn't find a direct match for this exact item")).toBeTruthy());
    expect(getByText("Different-brand travel stroller")).toBeTruthy();
    expect(getByText("Different model or brand")).toBeTruthy();
    expect(queryByText("No verified lower store offer was found.")).toBeNull();
  });
});
