import { fireEvent, render } from "@testing-library/react-native";

import PriceWatchesScreen from "../PriceWatchesScreen";
import { useWatches } from "../../components/watch/useWatches";
import { useAuth } from "../../contexts/useAuth";

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn((callback) => callback()),
}));
jest.mock("../../components/watch/useWatches", () => ({ useWatches: jest.fn() }));
jest.mock("../../contexts/useAuth", () => ({ useAuth: jest.fn() }));

const navigation = { goBack: jest.fn(), navigate: jest.fn() };
const watch = {
  id: "watch-1",
  asin: "B012345678",
  amazonDomain: "amazon.com",
  baselinePrice: 199,
  lastSeenPrice: 179,
  lastCheckedAt: "2026-06-28T12:00:00.000Z",
  paused: false,
  productTitle: "Compact Travel Stroller",
  productUrl: "https://amazon.com/dp/B012345678",
  targetPrice: null,
  thresholdPct: 5,
};

describe("PriceWatchesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWatches.mockReturnValue({
      error: "",
      loading: false,
      refresh: jest.fn(),
      remove: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      watches: [],
    });
  });

  it("shows an account sign-in state without requesting notification permission", () => {
    useAuth.mockReturnValue({ configured: true, user: null });
    const { getByText } = render(<PriceWatchesScreen navigation={navigation} />);

    fireEvent.press(getByText("Sign in"));
    expect(navigation.navigate).toHaveBeenCalledWith("Auth", { backLabel: "Price watches" });
  });

  it("renders watch status and expands native alert controls", () => {
    useAuth.mockReturnValue({ configured: true, user: { id: "user-1" } });
    useWatches.mockReturnValue({
      error: "",
      loading: false,
      refresh: jest.fn(),
      remove: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      watches: [watch],
    });
    const { getByText, getByTestId } = render(<PriceWatchesScreen navigation={navigation} />);

    expect(getByText("Alert baseline")).toBeTruthy();
    expect(getByText("Active email alert")).toBeTruthy();
    fireEvent.press(getByText("Alert settings"));
    expect(getByTestId("watches.threshold.watch-1").props.value).toBe("5");
    expect(getByTestId("watches.target.watch-1").props.value).toBe("");
  });
});
