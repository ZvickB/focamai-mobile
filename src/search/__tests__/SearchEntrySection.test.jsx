import { fireEvent, render } from "@testing-library/react-native";
import { SearchEntrySection } from "../SearchEntrySection";

describe("SearchEntrySection", () => {
  it("renders the search shell controls and forwards user actions", () => {
    const onSettingsPress = jest.fn();
    const setProductQuery = jest.fn();
    const startDiscoverySearch = jest.fn();

    const { getByTestId, getByText } = render(
      <SearchEntrySection
        isDiscovering={false}
        onSettingsPress={onSettingsPress}
        productQuery=""
        setProductQuery={setProductQuery}
        startDiscoverySearch={startDiscoverySearch}
      />,
    );

    fireEvent.changeText(getByTestId("search.queryInput"), "travel stroller");
    fireEvent.press(getByTestId("search.submitButton"));
    fireEvent.press(getByTestId("search.settingsButton"));

    expect(getByText("Start with the product you need")).toBeTruthy();
    expect(setProductQuery).toHaveBeenCalledWith("travel stroller");
    expect(startDiscoverySearch).toHaveBeenCalledWith("travel stroller");
    expect(onSettingsPress).toHaveBeenCalledTimes(1);
  });

  it("shows the searching state while discovery is running", () => {
    const { getByText } = render(
      <SearchEntrySection
        isDiscovering
        onSettingsPress={jest.fn()}
        productQuery="travel stroller"
        setProductQuery={jest.fn()}
        startDiscoverySearch={jest.fn()}
      />,
    );

    expect(getByText("Searching...")).toBeTruthy();
  });

  it("lets users fill the query from an example chip", () => {
    const setProductQuery = jest.fn();

    const { getByText } = render(
      <SearchEntrySection
        isDiscovering={false}
        onSettingsPress={jest.fn()}
        productQuery=""
        setProductQuery={setProductQuery}
        startDiscoverySearch={jest.fn()}
      />,
    );

    fireEvent.press(getByText("quiet air purifier"));

    expect(setProductQuery).toHaveBeenCalledWith("quiet air purifier");
  });

  it("submits the latest example chip value without waiting for parent state", () => {
    const setProductQuery = jest.fn();
    const startDiscoverySearch = jest.fn();

    const { getByTestId, getByText } = render(
      <SearchEntrySection
        isDiscovering={false}
        onSettingsPress={jest.fn()}
        productQuery="travel stroller"
        setProductQuery={setProductQuery}
        startDiscoverySearch={startDiscoverySearch}
      />,
    );

    fireEvent.press(getByText("quiet air purifier"));
    fireEvent.press(getByTestId("search.submitButton"));

    expect(startDiscoverySearch).toHaveBeenCalledWith("quiet air purifier");
  });
});
