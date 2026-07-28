import { fireEvent, render } from "@testing-library/react-native";
import { SearchEntrySection } from "../SearchEntrySection";

describe("SearchEntrySection", () => {
  it("renders the search shell controls and forwards user actions", () => {
    const setProductQuery = jest.fn();
    const startDiscoverySearch = jest.fn();

    const { getByTestId } = render(
      <SearchEntrySection
        isDiscovering={false}
        productQuery=""
        setProductQuery={setProductQuery}
        startDiscoverySearch={startDiscoverySearch}
      />,
    );

    fireEvent.changeText(getByTestId("search.queryInput"), "travel stroller");
    fireEvent.press(getByTestId("search.submitButton"));

    expect(getByTestId("search.voiceButton")).toBeTruthy();
    expect(setProductQuery).toHaveBeenCalledWith("travel stroller");
    expect(startDiscoverySearch).toHaveBeenCalledWith("travel stroller");
  });

  it("shows the searching state while discovery is running", () => {
    const { getByText } = render(
      <SearchEntrySection
        isDiscovering
        productQuery="travel stroller"
        setProductQuery={jest.fn()}
        startDiscoverySearch={jest.fn()}
      />,
    );

    expect(getByText("Searching...")).toBeTruthy();
  });

  it("keeps an empty submission inline and lets the user correct it", () => {
    const startDiscoverySearch = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <SearchEntrySection
        isDiscovering={false}
        productQuery=""
        setProductQuery={jest.fn()}
        startDiscoverySearch={startDiscoverySearch}
      />,
    );

    fireEvent.press(getByTestId("search.submitButton"));

    expect(getByTestId("search.emptyQueryMessage")).toBeTruthy();
    expect(startDiscoverySearch).not.toHaveBeenCalled();

    fireEvent.changeText(getByTestId("search.queryInput"), "travel stroller");

    expect(queryByTestId("search.emptyQueryMessage")).toBeNull();
  });

  it("submits the latest typed value without waiting for parent state", () => {
    const setProductQuery = jest.fn();
    const startDiscoverySearch = jest.fn();

    const { getByTestId } = render(
      <SearchEntrySection
        isDiscovering={false}
        productQuery="travel stroller"
        setProductQuery={setProductQuery}
        startDiscoverySearch={startDiscoverySearch}
      />,
    );

    fireEvent.changeText(getByTestId("search.queryInput"), "quiet air purifier");
    fireEvent.press(getByTestId("search.submitButton"));

    expect(startDiscoverySearch).toHaveBeenCalledWith("quiet air purifier");
  });
});
