import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AMAZON_MARKETPLACE_PROMPT_SEEN_KEY,
  AMAZON_MARKETPLACE_STORAGE_KEY,
  DEFAULT_AMAZON_DOMAIN,
  loadAmazonMarketplacePreference,
  loadSavedAmazonDomain,
  saveAmazonDomainPreference,
  saveAmazonMarketplacePromptSeen,
  saveAmazonMarketplaceSelection,
} from "../amazonMarketplaces";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("amazon marketplace persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a saved result when the marketplace preference is written", async () => {
    AsyncStorage.setItem.mockResolvedValue(undefined);

    await expect(saveAmazonDomainPreference("amazon.ca")).resolves.toEqual({
      domain: "amazon.ca",
      saved: true,
    });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      AMAZON_MARKETPLACE_STORAGE_KEY,
      "amazon.ca",
    );
  });

  it("accepts India as an active marketplace preference", async () => {
    AsyncStorage.setItem.mockResolvedValue(undefined);

    await expect(saveAmazonDomainPreference("amazon.in")).resolves.toEqual({
      domain: "amazon.in",
      saved: true,
    });
  });

  it("returns an unsaved result without throwing when preference storage fails", async () => {
    AsyncStorage.setItem.mockRejectedValue(new Error("storage unavailable"));

    await expect(saveAmazonDomainPreference("amazon.ca")).resolves.toEqual({
      domain: "amazon.ca",
      saved: false,
    });
  });

  it("reports whether the prompt-seen flag was saved", async () => {
    AsyncStorage.setItem.mockResolvedValueOnce(undefined);

    await expect(saveAmazonMarketplacePromptSeen()).resolves.toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      AMAZON_MARKETPLACE_PROMPT_SEEN_KEY,
      "true",
    );
  });

  it("does not mark the prompt seen when marketplace preference storage fails", async () => {
    AsyncStorage.setItem.mockRejectedValueOnce(new Error("storage unavailable"));

    await expect(saveAmazonMarketplaceSelection("amazon.ca")).resolves.toEqual({
      domain: "amazon.ca",
      promptSeenSaved: false,
      saved: false,
    });
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      AMAZON_MARKETPLACE_STORAGE_KEY,
      "amazon.ca",
    );
  });

  it("normalizes invalid selections before saving", async () => {
    AsyncStorage.setItem.mockResolvedValue(undefined);

    await expect(saveAmazonMarketplaceSelection("not-a-store")).resolves.toEqual({
      domain: DEFAULT_AMAZON_DOMAIN,
      promptSeenSaved: true,
      saved: true,
    });
  });

  it("treats stale untagged marketplace preferences as the default store", async () => {
    AsyncStorage.getItem.mockResolvedValue("amazon.co.uk");

    await expect(loadSavedAmazonDomain()).resolves.toBe(DEFAULT_AMAZON_DOMAIN);
    await expect(loadAmazonMarketplacePreference()).resolves.toEqual({
      domain: DEFAULT_AMAZON_DOMAIN,
      hasSavedPreference: false,
    });
  });
});
