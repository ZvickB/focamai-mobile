import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

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

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ clear: jest.fn() }),
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
    useAuth.mockReturnValue({ configured: true, session: null, signOut: jest.fn(), user: null });
    useSearchFlow.mockReset();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  it("opens signed-in personal actions from the avatar menu", () => {
    process.env.EXPO_PUBLIC_ACCOUNT_UI_ENABLED = "true";
    const navigation = { navigate: jest.fn(), setParams: jest.fn() };
    useAuth.mockReturnValue({
      configured: true,
      session: { access_token: "access-token" },
      signOut: jest.fn(),
      user: { email: "person@example.com" },
    });
    useSearchFlow.mockReturnValue(buildSearchFlow());

    const { getByTestId, getByText } = render(<SearchScreen navigation={navigation} route={{ params: {} }} />);

    fireEvent.press(getByTestId("search.accountButton"));
    expect(getByText("Preferences")).toBeTruthy();
    expect(getByText("Search history")).toBeTruthy();
    expect(getByText("Sign out")).toBeTruthy();
    expect(getByText("Delete account")).toBeTruthy();

    fireEvent.press(getByText("Search history"));
    expect(navigation.navigate).toHaveBeenCalledWith("History");
  });

  it("keeps account deletion behind a destructive confirmation", () => {
    process.env.EXPO_PUBLIC_ACCOUNT_UI_ENABLED = "true";
    const navigation = { navigate: jest.fn(), setParams: jest.fn() };
    useAuth.mockReturnValue({
      configured: true,
      session: { access_token: "access-token" },
      signOut: jest.fn(),
      user: { email: "person@example.com" },
    });
    useSearchFlow.mockReturnValue(buildSearchFlow());

    const { getByTestId, getByText } = render(<SearchScreen navigation={navigation} route={{ params: {} }} />);

    fireEvent.press(getByTestId("search.accountButton"));
    fireEvent.press(getByText("Delete account"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Delete your Focamai account?",
      expect.any(String),
      expect.arrayContaining([expect.objectContaining({ style: "destructive" })]),
    );
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
