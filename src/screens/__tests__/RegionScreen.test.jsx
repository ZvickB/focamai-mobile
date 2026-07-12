import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RegionScreen from "../RegionScreen";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

function renderRegionScreen() {
  const navigation = {
    navigate: jest.fn(),
  };

  return {
    navigation,
    ...render(<RegionScreen navigation={navigation} />),
  };
}

describe("RegionScreen", () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("keeps US and Canada as quick chips and reveals other major stores on demand", () => {
    const { getByText, getByTestId, queryByTestId } = renderRegionScreen();

    expect(getByText("Quick choices")).toBeTruthy();
    expect(getByTestId("region.chip.US")).toBeTruthy();
    expect(getByTestId("region.chip.CA")).toBeTruthy();
    expect(getByTestId("region.moreStoresButton")).toBeTruthy();
    expect(queryByTestId("region.row.GB")).toBeNull();

    fireEvent.press(getByTestId("region.moreStoresButton"));

    expect(getByTestId("region.moreStoresList")).toBeTruthy();
    expect(getByTestId("region.row.GB")).toBeTruthy();
    expect(getByTestId("region.row.DE")).toBeTruthy();
    expect(getByTestId("region.row.JP")).toBeTruthy();
    expect(getByTestId("region.row.IN")).toBeTruthy();
  });

  it("saves the selected region and returns to Search", async () => {
    const { getByTestId, navigation } = renderRegionScreen();

    fireEvent.press(getByTestId("region.chip.CA"));

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith("Search", {
        selectedAmazonDomain: "amazon.ca",
      });
    });
    await expect(AsyncStorage.getItem("focamai_marketplace")).resolves.toBe("amazon.ca");
  });
});
