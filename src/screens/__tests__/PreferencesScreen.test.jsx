import { fireEvent, render, waitFor } from "@testing-library/react-native";

import PreferencesScreen from "../PreferencesScreen";

const mockAuth = {
  rankingPreference: "balanced",
  rankingPreferenceError: "",
  rankingPreferenceLoading: false,
  setRankingPreference: jest.fn(),
};

jest.mock("../../contexts/useAuth", () => ({ useAuth: () => mockAuth }));

describe("PreferencesScreen", () => {
  beforeEach(() => {
    mockAuth.rankingPreference = "balanced";
    mockAuth.rankingPreferenceError = "";
    mockAuth.rankingPreferenceLoading = false;
    mockAuth.setRankingPreference.mockReset().mockResolvedValue({ error: null });
  });

  it("shows the ranking priorities and saves a changed choice", async () => {
    const navigation = { navigate: jest.fn() };
    const { getByText, getByTestId } = render(<PreferencesScreen navigation={navigation} />);

    expect(getByText("What should lead your picks?")).toBeTruthy();
    expect(getByText("Lowest prices")).toBeTruthy();

    fireEvent.press(getByTestId("preferences.option.price"));

    await waitFor(() => expect(mockAuth.setRankingPreference).toHaveBeenCalledWith("price"));
    expect(getByText("Saved to your account.")).toBeTruthy();
  });
});
