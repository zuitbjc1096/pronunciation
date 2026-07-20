// Recording replay module: records the child's voice using MediaRecorder,
// stores the blob URL, and lets the user play it back alongside the standard
// TTS pronunciation for comparison.
// Exposed as window.voiceRecorder.

(function () {
  let mediaRecorder = null;
  let chunks = [];
  let stream = null;
  let currentBlobUrl = null;
  let lastRecordedAt = 0;

  // Returns true if MediaRecorder is supported in this browser
  function isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  // Ensure we have mic permission; returns a stream or null on denial
  async function ensureStream() {
    if (stream) return stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return stream;
    } catch (e) {
      console.warn("voiceRecorder: mic access denied", e);
      return null;
    }
  }

  // Record for `durationMs` (default 4000ms) and return a playable URL
  function record(durationMs = 4000) {
    return new Promise(async (resolve) => {
      if (!isSupported()) {
        resolve(null);
        return;
      }
      const s = await ensureStream();
      if (!s) {
        resolve(null);
        return;
      }
      try {
        chunks = [];
        mediaRecorder = new MediaRecorder(s);
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        mediaRecorder.onstop = () => {
          // Revoke previous blob URL to avoid leaks
          if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
          const blob = new Blob(chunks, { type: chunks[0] ? chunks[0].type : "audio/webm" });
          currentBlobUrl = URL.createObjectURL(blob);
          lastRecordedAt = Date.now();
          resolve(currentBlobUrl);
        };
        mediaRecorder.start();
        setTimeout(() => {
          if (mediaRecorder && mediaRecorder.state === "recording") {
            try { mediaRecorder.stop(); } catch (e) { resolve(null); }
          }
        }, durationMs);
      } catch (e) {
        console.warn("voiceRecorder: record failed", e);
        resolve(null);
      }
    });
  }

  // Stop any active recording
  function stop() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      try { mediaRecorder.stop(); } catch (e) { /* ignore */ }
    }
  }

  // Play back the last recording
  function playLast() {
    if (!currentBlobUrl) return false;
    try {
      const audio = new Audio(currentBlobUrl);
      audio.play().catch(e => console.warn("playback blocked:", e));
      return true;
    } catch (e) {
      return false;
    }
  }

  function hasRecording() {
    return !!currentBlobUrl;
  }

  function getLastRecordedAt() {
    return lastRecordedAt;
  }

  // Release the mic stream (call when leaving the practice screen)
  function release() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
      currentBlobUrl = null;
    }
  }

  window.voiceRecorder = {
    isSupported,
    record,
    stop,
    playLast,
    hasRecording,
    getLastRecordedAt,
    release,
  };
})();
