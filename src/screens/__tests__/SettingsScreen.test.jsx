import { Alert } from "react-native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

import SettingsScreen from "../SettingsScreen";

const mockAuth = {
  configured: true,
  session: null,
  signOut: jest.fn(),
  user: null,
};
const mockDeleteAccount = jest.fn();
const mockClearHistory = jest.fn();
const mockClearQueries = jest.fn();

jest.mock("../../contexts/useAuth", () => ({ useAuth: () => mockAuth }));
jest.mock("../../lib/account/deleteAccount", () => ({ deleteAccount: (...args) => mockDeleteAccount(...args) }));
jest.mock("../../lib/history/localHistoryStore", () => ({
  localHistoryStore: { clear: (...args) => mockClearHistory(...args) },
}));
jest.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ clear: mockClearQueries }) }));

describe("SettingsScreen", () => {
  beforeEach(() => {
    mockAuth.session = null;
    mockAuth.user = null;
    mockAuth.signOut.mockReset().mockResolvedValue({ error: null });
    mockDeleteAccount.mockReset();
    mockClearHistory.mockReset().mockResolvedValue(undefined);
    mockClearQueries.mockReset();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    Alert.alert.mockClear();
  });

  it("opens search history from the settings list", () => {
    const navigation = {
      navigate: jest.fn(),
    };
    const { getByText } = render(<SettingsScreen navigation={navigation} />);

    fireEvent.press(getByText("Search history"));

    expect(navigation.navigate).toHaveBeenCalledWith("History");
  });

  it("shows account deletion only for signed-in users", () => {
    const navigation = { navigate: jest.fn(), reset: jest.fn() };
    const signedOut = render(<SettingsScreen navigation={navigation} />);
    expect(signedOut.queryByText("Delete account")).toBeNull();
    signedOut.unmount();

    mockAuth.user = { email: "person@example.com" };
    mockAuth.session = { access_token: "access-token" };
    const signedIn = render(<SettingsScreen navigation={navigation} />);
    expect(signedIn.getByText("Delete account")).toBeTruthy();
  });

  it("requires destructive confirmation then clears session, account state, and local history", async () => {
    mockAuth.user = { email: "person@example.com" };
    mockAuth.session = { access_token: "access-token" };
    mockDeleteAccount.mockResolvedValue({ ok: true });
    const navigation = { navigate: jest.fn(), reset: jest.fn() };
    const { getByText } = render(<SettingsScreen navigation={navigation} />);

    fireEvent.press(getByText("Delete account"));
    const buttons = Alert.alert.mock.calls[0][2];
    expect(buttons[1].style).toBe("destructive");
    await act(async () => buttons[1].onPress());

    expect(mockDeleteAccount).toHaveBeenCalledWith("access-token");
    expect(mockClearHistory).toHaveBeenCalled();
    expect(mockClearQueries).toHaveBeenCalled();
    expect(mockAuth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Search" }] });
  });

  it("shows a retry action after deletion fails", async () => {
    mockAuth.user = { email: "person@example.com" };
    mockAuth.session = { access_token: "access-token" };
    mockDeleteAccount.mockRejectedValue(new Error("Temporary deletion failure."));
    const navigation = { navigate: jest.fn(), reset: jest.fn() };
    const { getByText } = render(<SettingsScreen navigation={navigation} />);

    fireEvent.press(getByText("Delete account"));
    await act(async () => Alert.alert.mock.calls[0][2][1].onPress());

    await waitFor(() => expect(getByText("Temporary deletion failure.")).toBeTruthy());
    expect(getByText("Try deleting again")).toBeTruthy();
    expect(mockAuth.signOut).not.toHaveBeenCalled();
  });
});
