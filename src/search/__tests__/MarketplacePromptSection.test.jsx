import { fireEvent, render } from "@testing-library/react-native";
import { MarketplacePromptSection } from "../MarketplacePromptSection";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("MarketplacePromptSection", () => {
  it("keeps marketplace pill taps as draft state until confirm", () => {
    const confirmSelectedAmazonDomain = jest.fn();

    const { getByLabelText, getByText } = render(
      <MarketplacePromptSection
        confirmSelectedAmazonDomain={confirmSelectedAmazonDomain}
        selectedAmazonDomain="amazon.com"
      />,
    );

    fireEvent.press(getByLabelText("Select Canada"));

    expect(confirmSelectedAmazonDomain).not.toHaveBeenCalled();
    expect(getByText("Continue with Canada")).toBeTruthy();

    fireEvent.press(getByText("Continue with Canada"));

    expect(confirmSelectedAmazonDomain).toHaveBeenCalledWith("amazon.ca");
  });
});
