import { fireEvent, render, waitFor } from "@testing-library/react-native";

import SearchScreen from "../SearchScreen";
import { useAuth } from "../../contexts/useAuth";
import { useSearchFlow } from "../../search/SearchFlowContext";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("../../search/SearchFlowContext", () => ({
  useSearchFlow: jest.fn(),
}));

jest.mock("../../contexts/useAuth", () => ({
  useAuth: jest.fn(),
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
    delete process.env.EXPO_PUBLIC_ACCOUNT_UI_ENABLED;
    useAuth.mockReset();
    useAuth.mockReturnValue({ configured: true, user: null });
    useSearchFlow.mockReset();
  });

  it("opens sign in from the search header when signed out", () => {
    process.env.EXPO_PUBLIC_ACCOUNT_UI_ENABLED = "true";
    const navigation = { navigate: jest.fn(), setParams: jest.fn() };
    useSearchFlow.mockReturnValue(buildSearchFlow());

    const { getByTestId } = render(<SearchScreen navigation={navigation} route={{ params: {} }} />);

    fireEvent.press(getByTestId("search.signInButton"));
    expect(navigation.navigate).toHaveBeenCalledWith("Auth", { backLabel: "Search" });
  });

  it("hides sign in by default for the account-free Play release", () => {
    const navigation = { navigate: jest.fn(), setParams: jest.fn() };
    useSearchFlow.mockReturnValue(buildSearchFlow());

    const { queryByTestId } = render(
      <SearchScreen navigation={navigation} route={{ params: {} }} />,
    );

    expect(queryByTestId("search.signInButton")).toBeNull();
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
