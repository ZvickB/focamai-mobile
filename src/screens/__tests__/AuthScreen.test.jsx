import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { AuthContext } from "../../contexts/useAuth";
import AuthScreen from "../AuthScreen";

jest.mock("lucide-react-native", () => ({
  Eye: () => null,
  EyeOff: () => null,
  LockKeyhole: () => null,
}));

jest.mock("../../components/MobileUI", () => {
  const { Pressable, ScrollView, Text, View } = require("react-native");
  return {
    Button: ({ children, onPress, disabled, testID }) => (
      <Pressable onPress={onPress} disabled={disabled} testID={testID}>
        <Text>{typeof children === "string" ? children : null}</Text>
        {typeof children !== "string" ? children : null}
      </Pressable>
    ),
    HeaderBackButton: ({ label, onPress, testID }) => (
      <Pressable onPress={onPress} testID={testID}>
        <Text>{label}</Text>
      </Pressable>
    ),
    ScreenContainer: ({ children, testID }) => (
      <ScrollView testID={testID}>{children}</ScrollView>
    ),
    cx: (...classes) => classes.filter(Boolean).join(" "),
  };
});

function renderWithAuth(authOverrides = {}) {
  const authValue = {
    configured: true,
    loading: false,
    session: null,
    signIn: jest.fn().mockResolvedValue({ data: { session: {} }, error: null }),
    signInWithGoogle: jest.fn().mockResolvedValue({ error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    signUp: jest.fn().mockResolvedValue({ data: {}, error: null }),
    user: null,
    ...authOverrides,
  };

  const navigation = { goBack: jest.fn() };
  const route = { params: {} };

  const result = render(
    <AuthContext.Provider value={authValue}>
      <AuthScreen navigation={navigation} route={route} />
    </AuthContext.Provider>,
  );

  return { ...result, authValue, navigation };
}

describe("AuthScreen", () => {
  it("renders the sign in form by default", () => {
    const { getByTestId, getByText } = renderWithAuth();

    expect(getByTestId("auth.screen")).toBeTruthy();
    expect(getByTestId("auth.emailInput")).toBeTruthy();
    expect(getByTestId("auth.passwordInput")).toBeTruthy();
    expect(getByTestId("auth.submitButton")).toBeTruthy();
  });

  it("shows validation error when email or password is empty", async () => {
    const { getByTestId, getByText } = renderWithAuth();

    fireEvent.press(getByTestId("auth.submitButton"));

    await waitFor(() => {
      expect(getByText("Please enter your email and password.")).toBeTruthy();
    });
  });

  it("calls signIn with email and password", async () => {
    const { getByTestId, authValue, navigation } = renderWithAuth();

    fireEvent.changeText(getByTestId("auth.emailInput"), "test@example.com");
    fireEvent.changeText(getByTestId("auth.passwordInput"), "password123");
    fireEvent.press(getByTestId("auth.submitButton"));

    await waitFor(() => {
      expect(authValue.signIn).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    expect(navigation.goBack).toHaveBeenCalled();
  });

  it("trims email whitespace before submitting", async () => {
    const { getByTestId, authValue } = renderWithAuth();

    fireEvent.changeText(getByTestId("auth.emailInput"), "  test@example.com  ");
    fireEvent.changeText(getByTestId("auth.passwordInput"), "password123");
    fireEvent.press(getByTestId("auth.submitButton"));

    await waitFor(() => {
      expect(authValue.signIn).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("displays error when sign in fails", async () => {
    const signIn = jest.fn().mockResolvedValue({ data: null, error: new Error("Invalid credentials") });
    const { getByTestId, getByText } = renderWithAuth({ signIn });

    fireEvent.changeText(getByTestId("auth.emailInput"), "test@example.com");
    fireEvent.changeText(getByTestId("auth.passwordInput"), "wrong");
    fireEvent.press(getByTestId("auth.submitButton"));

    await waitFor(() => {
      expect(getByText("Invalid credentials")).toBeTruthy();
    });
  });

  it("handles sign in exception", async () => {
    const signIn = jest.fn().mockRejectedValue(new Error("Network error"));
    const { getByTestId, getByText } = renderWithAuth({ signIn });

    fireEvent.changeText(getByTestId("auth.emailInput"), "test@example.com");
    fireEvent.changeText(getByTestId("auth.passwordInput"), "pass");
    fireEvent.press(getByTestId("auth.submitButton"));

    await waitFor(() => {
      expect(getByText("Network error")).toBeTruthy();
    });
  });

  it("switches to sign up mode and calls signUp", async () => {
    const { getByTestId, getByText, authValue } = renderWithAuth();

    fireEvent.press(getByText("Create account"));
    fireEvent.changeText(getByTestId("auth.emailInput"), "new@example.com");
    fireEvent.changeText(getByTestId("auth.passwordInput"), "newpassword");
    fireEvent.press(getByTestId("auth.submitButton"));

    await waitFor(() => {
      expect(authValue.signUp).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "newpassword",
      });
    });
  });

  it("shows confirmation message on sign up without session", async () => {
    const signUp = jest.fn().mockResolvedValue({ data: { session: null }, error: null });
    const { getByTestId, getByText } = renderWithAuth({ signUp });

    fireEvent.press(getByText("Create account"));
    fireEvent.changeText(getByTestId("auth.emailInput"), "new@example.com");
    fireEvent.changeText(getByTestId("auth.passwordInput"), "newpassword");
    fireEvent.press(getByTestId("auth.submitButton"));

    await waitFor(() => {
      expect(getByText(/check your email/i)).toBeTruthy();
    });
  });

  it("shows error when auth is not configured", async () => {
    const { getByTestId, getByText } = renderWithAuth({ configured: false });

    fireEvent.changeText(getByTestId("auth.emailInput"), "test@example.com");
    fireEvent.changeText(getByTestId("auth.passwordInput"), "pass");
    fireEvent.press(getByTestId("auth.submitButton"));

    await waitFor(() => {
      expect(getByText(/not configured/i)).toBeTruthy();
    });
  });

  it("calls signInWithGoogle when Google button is pressed", async () => {
    const { getByTestId, authValue } = renderWithAuth();

    fireEvent.press(getByTestId("auth.googleButton"));

    await waitFor(() => {
      expect(authValue.signInWithGoogle).toHaveBeenCalled();
    });
  });

  it("shows error when Google sign in is not configured", async () => {
    const { getByTestId, getByText } = renderWithAuth({ configured: false });

    fireEvent.press(getByTestId("auth.googleButton"));

    await waitFor(() => {
      expect(getByText(/not configured/i)).toBeTruthy();
    });
  });

  it("navigates back when back button is pressed", () => {
    const { getByTestId, navigation } = renderWithAuth();

    fireEvent.press(getByTestId("auth.backButton"));

    expect(navigation.goBack).toHaveBeenCalled();
  });
});
