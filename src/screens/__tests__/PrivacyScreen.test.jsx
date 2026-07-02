import { render } from "@testing-library/react-native";

import PrivacyScreen from "../PrivacyScreen";

describe("PrivacyScreen", () => {
  it("describes the implemented account, voice, retention, and deletion behavior", () => {
    const { getByText } = render(<PrivacyScreen />);

    expect(getByText("How Focamai handles your information.")).toBeTruthy();
    expect(getByText(/Mobile supports email and password accounts/i)).toBeTruthy();
    expect(getByText(/forwards it to OpenAI for transcription/i)).toBeTruthy();
    expect(getByText(/Deep Dive usage record linked to that user ID/i)).toBeTruthy();
    expect(getByText(/Anonymous operational search logs/i)).toBeTruthy();
    expect(getByText(/Email contact@focamai.com/i)).toBeTruthy();
  });
});
