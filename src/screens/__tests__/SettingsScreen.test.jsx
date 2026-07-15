import { fireEvent, render } from "@testing-library/react-native";

import SettingsScreen from "../SettingsScreen";

const mockAuth = { user: null };

jest.mock("../../contexts/useAuth", () => ({ useAuth: () => mockAuth }));

describe("SettingsScreen", () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_ACCOUNT_UI_ENABLED;
    delete process.env.EXPO_PUBLIC_SENTRY_DEBUG_ENABLED;
    mockAuth.user = null;
  });

  it("opens Shopping region from the settings list", () => {
    const navigation = {
      navigate: jest.fn(),
    };
    const { getByText } = render(<SettingsScreen navigation={navigation} />);

    fireEvent.press(getByText("Shopping region"));

    expect(navigation.navigate).toHaveBeenCalledWith("Region");
  });

  it("keeps signed-in personal actions out of Settings", () => {
    process.env.EXPO_PUBLIC_ACCOUNT_UI_ENABLED = "true";
    mockAuth.user = { email: "person@example.com" };
    const navigation = { navigate: jest.fn() };
    const { queryByText } = render(<SettingsScreen navigation={navigation} />);

    expect(queryByText("Search history")).toBeNull();
    expect(queryByText("Preferences")).toBeNull();
    expect(queryByText("Price watches")).toBeNull();
    expect(queryByText("Sign out")).toBeNull();
    expect(queryByText("Delete account")).toBeNull();
  });

  it("keeps device-local history reachable from Settings while signed out", () => {
    const navigation = { navigate: jest.fn() };
    const { getByText } = render(<SettingsScreen navigation={navigation} />);

    fireEvent.press(getByText("Search history"));

    expect(navigation.navigate).toHaveBeenCalledWith("History");
  });

  it("shows the temporary Sentry verifier only for internal verification builds", () => {
    process.env.EXPO_PUBLIC_SENTRY_DEBUG_ENABLED = "true";
    const navigation = { navigate: jest.fn() };
    const { getByText } = render(<SettingsScreen navigation={navigation} />);

    fireEvent.press(getByText("Sentry verification (temporary)"));

    expect(navigation.navigate).toHaveBeenCalledWith("SentryVerification");
  });
});
