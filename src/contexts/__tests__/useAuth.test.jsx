import { renderHook } from "@testing-library/react-native";

import { AuthContext, useAuth } from "../useAuth";

describe("useAuth", () => {
  it("returns the fallback when no provider is present", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.configured).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("fallback signIn returns an error", async () => {
    const { result } = renderHook(() => useAuth());

    const { error } = await result.current.signIn();
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toMatch(/not configured/);
  });

  it("fallback signUp returns an error", async () => {
    const { result } = renderHook(() => useAuth());

    const { error } = await result.current.signUp();
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toMatch(/not configured/);
  });

  it("fallback signInWithGoogle returns an error", async () => {
    const { result } = renderHook(() => useAuth());

    const { error } = await result.current.signInWithGoogle();
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toMatch(/not configured/);
  });

  it("fallback signOut succeeds with no error", async () => {
    const { result } = renderHook(() => useAuth());

    const { error } = await result.current.signOut();
    expect(error).toBeNull();
  });

  it("returns the provided context value when inside a provider", () => {
    const contextValue = {
      configured: true,
      loading: false,
      session: { access_token: "abc" },
      signIn: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
      user: { id: "user-1", email: "test@example.com" },
    };

    const wrapper = ({ children }) => (
      <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.configured).toBe(true);
    expect(result.current.user).toEqual({ id: "user-1", email: "test@example.com" });
    expect(result.current.session).toEqual({ access_token: "abc" });
  });
});
