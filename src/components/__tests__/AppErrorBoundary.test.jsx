import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";

import { AppErrorBoundary } from "../AppErrorBoundary";

function ProblemChild({ shouldThrow = true }) {
  if (shouldThrow) throw new Error("test crash");
  return <Text>child rendered</Text>;
}

// Suppress console.error noise from React error boundary logging
beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

describe("AppErrorBoundary", () => {
  it("renders children when there is no error", () => {
    const { getByText } = render(
      <AppErrorBoundary>
        <Text>hello world</Text>
      </AppErrorBoundary>,
    );

    expect(getByText("hello world")).toBeTruthy();
  });

  it("renders fallback UI when a child throws", () => {
    const { getByText, queryByText } = render(
      <AppErrorBoundary>
        <ProblemChild />
      </AppErrorBoundary>,
    );

    expect(getByText("Something went wrong")).toBeTruthy();
    expect(getByText(/unexpected error/i)).toBeTruthy();
    expect(getByText("Try again")).toBeTruthy();
    expect(queryByText("child rendered")).toBeNull();
  });

  it("resets error state when 'Try again' is pressed", () => {
    let shouldThrow = true;
    function ConditionalChild() {
      if (shouldThrow) throw new Error("test crash");
      return <Text>recovered</Text>;
    }

    const { getByText } = render(
      <AppErrorBoundary>
        <ConditionalChild />
      </AppErrorBoundary>,
    );

    expect(getByText("Something went wrong")).toBeTruthy();

    shouldThrow = false;
    fireEvent.press(getByText("Try again"));

    expect(getByText("recovered")).toBeTruthy();
  });
});
