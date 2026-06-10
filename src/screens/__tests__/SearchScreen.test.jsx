import { render, waitFor } from "@testing-library/react-native";

import SearchScreen from "../SearchScreen";
import { useSearchFlow } from "../../search/SearchFlowContext";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("../../search/SearchFlowContext", () => ({
  useSearchFlow: jest.fn(),
}));

function buildSearchFlow(overrides = {}) {
  return {
    activeSearchSession: null,
    confirmSelectedAmazonDomain: jest.fn(),
    errorMessage: "",
    followUpNotes: "",
    isDiscovering: false,
    productQuery: "",
    selectedAmazonDomain: "amazon.com",
    setFollowUpNotes: jest.fn(),
    setProductQuery: jest.fn(),
    setSelectedAmazonDomain: jest.fn(),
    showMarketplacePrompt: false,
    startDiscoverySearch: jest.fn(),
    ...overrides,
  };
}

describe("SearchScreen", () => {
  beforeEach(() => {
    useSearchFlow.mockReset();
  });

  it("prefills a saved search for review without starting it", async () => {
    const navigation = {
      navigate: jest.fn(),
      setParams: jest.fn(),
    };
    const searchFlow = buildSearchFlow();
    useSearchFlow.mockReturnValue(searchFlow);

    render(
      <SearchScreen
        navigation={navigation}
        route={{
          params: {
            historySearch: {
              followUp: "under $250",
              query: "travel stroller",
            },
          },
        }}
      />,
    );

    await waitFor(() => {
      expect(searchFlow.setProductQuery).toHaveBeenCalledWith("travel stroller");
    });
    expect(searchFlow.setFollowUpNotes).toHaveBeenCalledWith("under $250");
    expect(searchFlow.startDiscoverySearch).not.toHaveBeenCalled();
    expect(navigation.setParams).toHaveBeenCalledWith({ historySearch: undefined });
  });
});
