export const captureException = jest.fn();
export const init = jest.fn();
export const appLoaded = jest.fn();
export const reactNavigationIntegration = jest.fn(() => ({}));
export const reactNativeTracingIntegration = jest.fn(() => ({}));
export const startSpan = jest.fn((_, callback) => callback());
export const wrap = jest.fn((Component) => Component);
