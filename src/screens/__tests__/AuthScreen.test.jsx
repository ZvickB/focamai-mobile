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

function renderWithAuth(authOverrides = {}, routeOverrides = {}) {
  const authValue = {
    configured: true,
    loading: false,
    requestPasswordReset: jest.fn().mockResolvedValue({ error: null }),
    session: null,
    signIn: jest.fn().mockResolvedValue({ data: { session: {} }, error: null }),
    signInWithGoogle: jest.fn().mockResolvedValue({ error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    signUp: jest.fn().mockResolvedValue({ data: {}, error: null }),
    user: null,
    ...authOverrides,
  };

  const navigation = { goBack: jest.fn(), replace: jest.fn() };
  const route = { name: "Auth", params: {}, ...routeOverrides };

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

  it("opens create account as a replacement route", () => {
    const { getByText, navigation } = renderWithAuth();

    fireEvent.press(getByText("Create account"));

    expect(navigation.replace).toHaveBeenCalledWith("CreateAccount", {
      backLabel: undefined,
      draftEmail: "",
    });
  });

  it("calls signUp from the create-account route", async () => {
    const { getByTestId, authValue } = renderWithAuth({}, { name: "CreateAccount" });

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
    const { getByTestId, getByText } = renderWithAuth(
      { signUp },
      { name: "CreateAccount" },
    );

    fireEvent.changeText(getByTestId("auth.emailInput"), "new@example.com");
    fireEvent.changeText(getByTestId("auth.passwordInput"), "newpassword");
    fireEvent.press(getByTestId("auth.submitButton"));

    await waitFor(() => {
      expect(getByText(/confirmation email/i)).toBeTruthy();
    });
  });

  it("rejects a short password before requesting sign up", async () => {
    const { getByTestId, getByText, authValue } = renderWithAuth({}, { name: "CreateAccount" });

    fireEvent.changeText(getByTestId("auth.emailInput"), "new@example.com");
    fireEvent.changeText(getByTestId("auth.passwordInput"), "short");
    fireEvent.press(getByTestId("auth.submitButton"));

    await waitFor(() => {
      expect(getByText("Use a password with at least 6 characters.")).toBeTruthy();
    });
    expect(authValue.signUp).not.toHaveBeenCalled();
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

  it("requests a password reset for the entered email", async () => {
    const { getByTestId, getByText, authValue } = renderWithAuth();

    fireEvent.changeText(getByTestId("auth.emailInput"), "  test@example.com  ");
    fireEvent.press(getByTestId("auth.forgotPasswordButton"));

    await waitFor(() => {
      expect(authValue.requestPasswordReset).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(getByText(/sent a password-reset link/i)).toBeTruthy();
    });
  });

  it("requires an email before requesting a password reset", async () => {
    const { getByTestId, getByText, authValue } = renderWithAuth();

    fireEvent.press(getByTestId("auth.forgotPasswordButton"));

    await waitFor(() => {
      expect(getByText("Enter your email address first.")).toBeTruthy();
    });
    expect(authValue.requestPasswordReset).not.toHaveBeenCalled();
  });

  it("starts Google sign in and navigates back after a session is created", async () => {
    const { getByTestId, authValue, navigation } = renderWithAuth();

    fireEvent.press(getByTestId("auth.googleButton"));

    await waitFor(() => {
      expect(authValue.signInWithGoogle).toHaveBeenCalledTimes(1);
    });
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it("keeps the auth screen open when Google sign in is cancelled", async () => {
    const signInWithGoogle = jest.fn().mockResolvedValue({ data: { cancelled: true }, error: null });
    const { getByTestId, navigation } = renderWithAuth({ signInWithGoogle });

    fireEvent.press(getByTestId("auth.googleButton"));

    await waitFor(() => {
      expect(signInWithGoogle).toHaveBeenCalledTimes(1);
    });
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it("navigates back when back button is pressed", () => {
    const { getByTestId, navigation } = renderWithAuth();

    fireEvent.press(getByTestId("auth.backButton"));

    expect(navigation.goBack).toHaveBeenCalled();
  });
});
