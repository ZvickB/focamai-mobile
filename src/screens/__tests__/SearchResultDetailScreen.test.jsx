import { fireEvent, render, waitFor } from "@testing-library/react-native";
import SearchResultDetailScreen from "../SearchResultDetailScreen";
import { useSearchFlow } from "../../search/SearchFlowContext";
import { useAuth } from "../../contexts/useAuth";
import { useWatches } from "../../components/watch/useWatches";

jest.mock("../../search/SearchFlowContext", () => ({
  useSearchFlow: jest.fn(),
}));
jest.mock("../../contexts/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("../../components/watch/useWatches", () => ({ useWatches: jest.fn() }));

const linkedItem = {
  caveat: "",
  feature_bullets: [],
  fit_reason: "",
  id: "candidate-1",
  image: "",
  link: "https://example.com/product",
  price: "$199",
  provider: "Amazon",
  rating: 4.4,
  reviewCount: 128,
  title: "Compact Travel Stroller",
};

function renderDetail(item = linkedItem, navigation = { goBack: jest.fn(), navigate: jest.fn() }) {
  useSearchFlow.mockReturnValue({
    activeSearchSession: {
      phases: {
        enrich: "complete",
      },
    },
    finalResults: [item],
  });

  return {
    ...render(
    <SearchResultDetailScreen
      navigation={navigation}
      route={{
        params: {
          candidateId: item.id,
          rank: 1,
        },
      }}
    />,
    ),
    navigation,
  };
}

describe("SearchResultDetailScreen", () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_DEEP_DIVE_UI_ENABLED = "true";
    process.env.EXPO_PUBLIC_PRICE_WATCH_UI_ENABLED = "true";
    useSearchFlow.mockReset();
    useAuth.mockReturnValue({ user: null });
    useWatches.mockReturnValue({ create: jest.fn(), watches: [] });
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_DEEP_DIVE_UI_ENABLED;
    delete process.env.EXPO_PUBLIC_PRICE_WATCH_UI_ENABLED;
  });

  it("hides optional product tools by default for the Play release", () => {
    delete process.env.EXPO_PUBLIC_DEEP_DIVE_UI_ENABLED;
    delete process.env.EXPO_PUBLIC_PRICE_WATCH_UI_ENABLED;
    const actionableItem = {
      ...linkedItem,
      asin: "B012345678",
      numericPrice: 199,
      deepDiveEligibility: { recommendation: "show", mode: "offers_and_reviews" },
    };
    const { queryByText } = renderDetail(actionableItem);

    expect(queryByText("Optional tools")).toBeNull();
    expect(queryByText("Deep dive — store prices and reviews")).toBeNull();
    expect(queryByText("Watch price")).toBeNull();
  });

  it("keeps retailer access visible in a fixed footer when a link exists", () => {
    const { getAllByText, getByText } = renderDetail();

    expect(getAllByText("$199.00").length).toBeGreaterThan(0);
    expect(getAllByText("Amazon").length).toBeGreaterThan(0);
    expect(getByText("As an Amazon Associate I earn from qualifying purchases.")).toBeTruthy();
    expect(getAllByText("View on Amazon")).toHaveLength(1);
  });

  it("does not show the fixed retailer footer when the link is unavailable", () => {
    const { getByText, queryByText } = renderDetail({
      ...linkedItem,
      link: "",
    });

    expect(getByText("Link unavailable")).toBeTruthy();
    expect(queryByText("View on Amazon")).toBeNull();
  });

  it("prefers the live shortlist rank over the route snapshot rank", () => {
    useSearchFlow.mockReturnValue({
      activeSearchSession: {
        phases: {
          enrich: "complete",
        },
      },
      finalResults: [
        { ...linkedItem, id: "candidate-0", title: "Different pick" },
        linkedItem,
      ],
    });

    const { getAllByText } = render(
      <SearchResultDetailScreen
        route={{
          params: {
            candidateId: linkedItem.id,
            item: linkedItem,
            rank: 1,
          },
        }}
      />,
    );

    expect(getAllByText("Pick #2").length).toBeGreaterThan(0);
  });

  it("falls back to the tapped item snapshot when the live shortlist changes", () => {
    useSearchFlow.mockReturnValue({
      activeSearchSession: {
        phases: {
          enrich: "complete",
        },
      },
      finalResults: [],
    });

    const { getByText } = render(
      <SearchResultDetailScreen
        route={{
          params: {
            candidateId: linkedItem.id,
            item: linkedItem,
            rank: 1,
          },
        }}
      />,
    );

    expect(getByText("Compact Travel Stroller")).toBeTruthy();
    expect(getByText("Showing the pick you opened earlier.")).toBeTruthy();
  });

  it("renders a clear unavailable state when no live item or snapshot exists", () => {
    useSearchFlow.mockReturnValue({
      activeSearchSession: {
        phases: {
          enrich: "running",
        },
      },
      finalResults: null,
    });

    const { getByText, queryByText } = render(
      <SearchResultDetailScreen
        route={{
          params: {
            candidateId: "missing-candidate",
          },
        }}
      />,
    );

    expect(getByText("Pick details unavailable")).toBeTruthy();
    expect(getByText("Go back and select a current pick.")).toBeTruthy();
    expect(queryByText("Extra analysis is still running.")).toBeNull();
  });

  it("keeps finalized watch and Deep Dive actions behind the account return flow", () => {
    const actionableItem = {
      ...linkedItem,
      asin: "B012345678",
      numericPrice: 199,
      deepDiveEligibility: { recommendation: "show", mode: "offers_and_reviews" },
    };
    const { getByText, navigation } = renderDetail(actionableItem);

    fireEvent.press(getByText("Deep dive — store prices and reviews"));
    fireEvent.press(getByText("Watch price"));

    expect(navigation.navigate).toHaveBeenNthCalledWith(1, "Auth", { backLabel: "Product" });
    expect(navigation.navigate).toHaveBeenNthCalledWith(2, "Auth", { backLabel: "Product" });
  });

  it("creates the default five-percent watch for a signed-in finalized pick", async () => {
    const create = jest.fn().mockResolvedValue({ id: "watch-1" });
    useAuth.mockReturnValue({ user: { id: "user-1" } });
    useWatches.mockReturnValue({ create, watches: [] });
    const actionableItem = {
      ...linkedItem,
      asin: "B012345678",
      numericPrice: 199,
    };
    const { getByText } = renderDetail(actionableItem);

    fireEvent.press(getByText("Watch price"));
    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({
      amazonDomain: "amazon.com",
      asin: "B012345678",
      baselinePrice: 199,
      targetPrice: null,
      thresholdPct: 5,
    })));
    expect(getByText(/We’ll email you/)).toBeTruthy();
  });
});
