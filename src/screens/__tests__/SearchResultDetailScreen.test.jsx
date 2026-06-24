import { render } from "@testing-library/react-native";
import SearchResultDetailScreen from "../SearchResultDetailScreen";
import { useSearchFlow } from "../../search/SearchFlowContext";

jest.mock("../../search/SearchFlowContext", () => ({
  useSearchFlow: jest.fn(),
}));

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

function renderDetail(item = linkedItem) {
  useSearchFlow.mockReturnValue({
    activeSearchSession: {
      phases: {
        enrich: "complete",
      },
    },
    finalResults: [item],
  });

  return render(
    <SearchResultDetailScreen
      route={{
        params: {
          candidateId: item.id,
          rank: 1,
        },
      }}
    />,
  );
}

describe("SearchResultDetailScreen", () => {
  beforeEach(() => {
    useSearchFlow.mockReset();
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
});
