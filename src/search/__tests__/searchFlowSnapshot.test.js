import AsyncStorage from "@react-native-async-storage/async-storage";

import { readFlowSnapshot, saveFlowSnapshot } from "../searchFlowSnapshot";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

describe("searchFlowSnapshot", () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-04T12:00:00.000Z"));
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("restores a snapshot for up to 30 minutes", async () => {
    await saveFlowSnapshot({
      phase: "refine",
      discoveryToken: "discovery-token",
      submittedQuery: "office chair",
    });

    jest.setSystemTime(new Date("2026-08-04T12:30:00.000Z"));

    await expect(readFlowSnapshot()).resolves.toMatchObject({
      phase: "refine",
      discoveryToken: "discovery-token",
      submittedQuery: "office chair",
    });
  });

  it("clears a snapshot older than 30 minutes", async () => {
    await saveFlowSnapshot({
      phase: "results",
      discoveryToken: "discovery-token",
      submittedQuery: "office chair",
    });

    jest.setSystemTime(new Date("2026-08-04T12:30:00.001Z"));

    await expect(readFlowSnapshot()).resolves.toBeNull();
    await expect(AsyncStorage.getItem("focamai:searchFlowSnapshot:v1")).resolves.toBeNull();
  });
});
