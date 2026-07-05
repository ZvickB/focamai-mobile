import { act, fireEvent, render } from "@testing-library/react-native";
import { ProductImageFrame } from "../MobileUI";

describe("ProductImageFrame", () => {
  let warnSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    jest.useRealTimers();
  });

  it("retries one failed image load before showing the fallback", () => {
    const view = render(
      <ProductImageFrame image="https://example.com/product.jpg" title="Product" />,
    );

    fireEvent(view.getByLabelText("Product"), "error", {
      nativeEvent: { error: "Could not connect to the server." },
    });

    expect(view.queryByText("Image pending")).toBeNull();

    act(() => {
      jest.runOnlyPendingTimers();
    });

    fireEvent(view.getByLabelText("Product"), "error", {
      nativeEvent: { error: "Could not connect to the server." },
    });

    expect(view.getByText("Image pending")).toBeTruthy();
  });

  it("recovers when the image URL changes after a terminal failure", () => {
    const view = render(
      <ProductImageFrame image="https://example.com/old.jpg" title="Product" />,
    );

    fireEvent(view.getByLabelText("Product"), "error", {
      nativeEvent: { error: "Could not connect to the server." },
    });

    act(() => {
      jest.runOnlyPendingTimers();
    });

    fireEvent(view.getByLabelText("Product"), "error", {
      nativeEvent: { error: "Could not connect to the server." },
    });

    view.rerender(
      <ProductImageFrame image="https://example.com/new.jpg" title="Product" />,
    );

    expect(view.getByLabelText("Product").props.source).toEqual({
      uri: "https://example.com/new.jpg",
    });
    expect(view.queryByText("Image pending")).toBeNull();
  });
});
