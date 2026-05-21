import { act, render } from "@testing-library/react-native";
import { FinalizeLoadingState } from "../FinalizeLoadingState";

describe("FinalizeLoadingState", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("shows the short finalize wait headline and native skeleton cards", () => {
    const { getAllByTestId, getByText } = render(<FinalizeLoadingState />);

    expect(getByText("We're on it. Your results will be here soon.")).toBeTruthy();
    expect(getByText("Focamai is narrowing the options around your search and notes.")).toBeTruthy();
    expect(getByText("Reading your search")).toBeTruthy();
    expect(getAllByTestId(/finalizeLoading\.skeleton\./)).toHaveLength(3);
    expect(getAllByTestId(/finalizeLoading\.logo\./)).toHaveLength(3);
  });

  it("advances calm stage copy for the expected short wait", () => {
    const { getByText } = render(<FinalizeLoadingState />);

    act(() => {
      jest.advanceTimersByTime(1200);
    });
    expect(getByText("Applying your notes")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1400);
    });
    expect(getByText("Narrowing to six picks")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1200);
    });
    expect(getByText("Getting the shortlist ready")).toBeTruthy();
  });
});
