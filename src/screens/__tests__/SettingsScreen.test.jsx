import { fireEvent, render } from "@testing-library/react-native";

import SettingsScreen from "../SettingsScreen";

describe("SettingsScreen", () => {
  it("opens search history from the settings list", () => {
    const navigation = {
      navigate: jest.fn(),
    };
    const { getByText } = render(<SettingsScreen navigation={navigation} />);

    fireEvent.press(getByText("Search history"));

    expect(navigation.navigate).toHaveBeenCalledWith("History");
  });
});
