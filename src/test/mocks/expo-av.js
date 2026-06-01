const recordingMock = {
  getURI: jest.fn(() => "file:///mock-recording.m4a"),
  stopAndUnloadAsync: jest.fn(() => Promise.resolve()),
};

export const Audio = {
  Recording: {
    createAsync: jest.fn(() => Promise.resolve({ recording: recordingMock })),
  },
  RecordingOptionsPresets: {
    HIGH_QUALITY: {},
  },
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
};

export function __resetExpoAvMock() {
  recordingMock.getURI.mockClear();
  recordingMock.stopAndUnloadAsync.mockClear();
  Audio.Recording.createAsync.mockClear();
  Audio.requestPermissionsAsync.mockClear();
  Audio.setAudioModeAsync.mockClear();
}
