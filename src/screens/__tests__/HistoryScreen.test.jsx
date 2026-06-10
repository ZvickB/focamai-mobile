import { fireEvent, render } from "@testing-library/react-native";

import HistoryScreen from "../HistoryScreen";
import { useSearchHistory } from "../../components/history/useSearchHistory";

jest.mock("../../components/history/useSearchHistory", () => ({
  useSearchHistory: jest.fn(),
}));

const savedEntry = {
  amazonDomain: "amazon.com",
  createdAt: "2026-06-10T12:00:00.000Z",
  followUp: "under $250",
  id: "entry-1",
  query: "travel stroller",
  queryKey: "travel stroller\u0001under $250",
  results: [
    {
      id: "pick-1",
      image: "",
      price: "$199",
      rating: 4.4,
      reviewCount: 128,
      title: "Compact Travel Stroller",
    },
  ],
  updatedAt: "2026-06-10T12:00:00.000Z",
};

function renderHistory(historyOverrides = {}) {
  const navigation = {
    navigate: jest.fn(),
  };
  const historyState = {
    clear: jest.fn(),
    entries: [savedEntry],
    error: "",
    loading: false,
    remove: jest.fn(),
    ...historyOverrides,
  };

  useSearchHistory.mockReturnValue(historyState);

  return {
    historyState,
    navigation,
    ...render(<HistoryScreen navigation={navigation} route={{ params: {} }} />),
  };
}

describe("HistoryScreen", () => {
  beforeEach(() => {
    useSearchHistory.mockReset();
  });

  it("lists, expands, deletes, clears, and re-runs saved searches", () => {
    const { getByTestId, getByText, historyState, navigation } = renderHistory();

    expect(getByText("travel stroller")).toBeTruthy();
    fireEvent.press(getByTestId("history.entryToggle.entry-1"));
    expect(getByTestId("history.pick.1")).toBeTruthy();

    fireEvent.press(getByTestId("history.delete.entry-1"));
    expect(historyState.remove).toHaveBeenCalledWith("entry-1");

    fireEvent.press(getByTestId("history.clearButton"));
    expect(historyState.clear).toHaveBeenCalled();

    fireEvent.press(getByTestId("history.rerun.entry-1"));
    expect(navigation.navigate).toHaveBeenCalledWith("Search", {
      historySearch: {
        followUp: "under $250",
        query: "travel stroller",
      },
    });
  });

  it("shows an empty state with a start-search action", () => {
    const { getByTestId, getByText, navigation } = renderHistory({ entries: [] });

    expect(getByText("No saved searches yet.")).toBeTruthy();
    fireEvent.press(getByTestId("history.startSearchButton"));
    expect(navigation.navigate).toHaveBeenCalledWith("Search");
  });
});
