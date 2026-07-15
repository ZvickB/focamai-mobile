import { render } from "@testing-library/react-native";

import PrivacyScreen from "../PrivacyScreen";

describe("PrivacyScreen", () => {
  it("describes the implemented account, voice, retention, and deletion behavior", () => {
    const { getByText } = render(<PrivacyScreen />);

    expect(getByText("How Focamai handles your information.")).toBeTruthy();
    expect(getByText(/Mobile supports sign-in using email and password or Google Sign-In/i)).toBeTruthy();
    expect(getByText(/forwards it to OpenAI for transcription/i)).toBeTruthy();
    expect(getByText(/ranking preferences, saved searches, price watches, and Deep Dive usage/i)).toBeTruthy();
    expect(getByText(/Anonymous operational search logs/i)).toBeTruthy();
    expect(getByText(/does not automatically purge the underlying database row/i)).toBeTruthy();
    expect(getByText(/Email contact@focamai.com/i)).toBeTruthy();
  });
});
