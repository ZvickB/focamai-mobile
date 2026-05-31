import { useRef, useState } from "react";
import { Audio } from "expo-av";
import { getApiBaseUrl } from "./searchApi";

// status: idle | recording | processing | error
export function useVoiceRecorder({ onTranscribed }) {
  const [status, setStatus] = useState("idle");
  const recordingRef = useRef(null);

  async function startRecording() {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2000);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setStatus("recording");
    } catch (e) {
      console.error("[useVoiceRecorder] startRecording error", e);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  async function stopRecording() {
    const recording = recordingRef.current;
    if (!recording) return;

    try {
      setStatus("processing");
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const formData = new FormData();
      formData.append("audio", { uri, type: "audio/m4a", name: "recording.m4a" });

      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Transcription request failed");

      const { text } = await response.json();
      if (text) {
        onTranscribed(text);
      }
      setStatus("idle");
    } catch (e) {
      console.error("[useVoiceRecorder] stopRecording error", e);
      recordingRef.current = null;
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  function handleMicPress() {
    if (status === "idle") {
      startRecording();
    } else if (status === "recording") {
      stopRecording();
    }
    // processing/error: ignore taps
  }

  return { status, handleMicPress };
}
