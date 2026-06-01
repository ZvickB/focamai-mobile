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

  it("separates common regions from the longer region list", () => {
    const { getByText, getByTestId } = renderRegionScreen();

    expect(getByText("Common regions")).toBeTruthy();
    expect(getByText("More regions")).toBeTruthy();
    expect(getByTestId("region.row.US")).toBeTruthy();
    expect(getByTestId("region.row.CA")).toBeTruthy();
    expect(getByTestId("region.row.GB")).toBeTruthy();
    expect(getByTestId("region.row.DE")).toBeTruthy();
  });

  it("saves the selected region and returns to Search", async () => {
    const { getByTestId, navigation } = renderRegionScreen();

    fireEvent.press(getByTestId("region.row.CA"));

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith("Search", {
        selectedAmazonDomain: "amazon.ca",
      });
    });
    await expect(AsyncStorage.getItem("focamai_marketplace")).resolves.toBe("amazon.ca");
  });
});
