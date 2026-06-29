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

  it("renders verified offers and review signals from an explicit request", async () => {
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
      reviews: {
        topInsights: [{ text: "Easy fold" }],
        criticRatings: [{ source: "Review Lab", rating: "8/10" }],
        userReviews: [{ source: "Store buyers", rating: 5, text: "Compact and easy to carry." }],
      },
    });

    const { getByText } = renderScreen();

    await waitFor(() => expect(getByText("Example Store")).toBeTruthy());
    expect(getByText("Saves $20.00")).toBeTruthy();
    expect(getByText("Easy fold")).toBeTruthy();
    expect(getByText("Review Lab")).toBeTruthy();
    expect(fetchProductDeepDive).toHaveBeenCalledWith(expect.objectContaining({
      candidateId: "candidate-1",
      discoveryToken: "token-1",
      token: "session-token",
    }));
  });

  it("offers a separate USD fallback when Canada has no lower offers", async () => {
    fetchProductDeepDive
      .mockResolvedValueOnce({ status: "ready", offers: [], reviews: {} })
      .mockResolvedValueOnce({
        status: "ready",
        offers: [{ retailer: "US Store", knownTotal: 150, currency: "USD", url: "https://example.com" }],
        reviews: {},
      });

    const { getByText } = renderScreen({ amazonDomain: "amazon.ca" });
    await waitFor(() => expect(getByText("Show US retailer prices")).toBeTruthy());
    fireEvent.press(getByText("Show US retailer prices"));
    await waitFor(() => expect(getByText("US store offers (USD)")).toBeTruthy());
    expect(fetchProductDeepDive).toHaveBeenLastCalledWith(expect.objectContaining({
      crossMarketFallback: true,
    }));
  });
});
