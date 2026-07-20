// Safe storage layer: wraps localStorage with graceful fallback.
// Handles iOS Safari private mode (throws on setItem), quota exceeded,
// and JSON parse errors. Never throws — returns safe defaults instead.
// Exposed as window.safeStorage since this project uses classic scripts.

(function () {
  const memoryFallback = {};
  let persistent = true;

  try {
    const k = "__probe__" + Date.now();
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
  } catch (e) {
    persistent = false;
  }

  const safeStorage = {
    // True when data will survive a page reload. False in iOS private mode.
    isPersistent: persistent,

    get(key, defaultValue = null) {
      try {
        const raw = persistent ? localStorage.getItem(key) : memoryFallback[key];
        if (raw == null || raw === undefined) return defaultValue;
        return JSON.parse(raw);
      } catch (e) {
        console.warn(`safeStorage.get(${key}) parse failed:`, e);
        return defaultValue;
      }
    },

    set(key, value) {
      const serialized = JSON.stringify(value);
      try {
        if (persistent) {
          localStorage.setItem(key, serialized);
        } else {
          memoryFallback[key] = serialized;
        }
        return true;
      } catch (e) {
        console.warn(`safeStorage.set(${key}) failed:`, e);
        return false;
      }
    },

    remove(key) {
      try {
        if (persistent) localStorage.removeItem(key);
        else delete memoryFallback[key];
      } catch (e) { /* ignore */ }
    },

    usageBytes() {
      const src = persistent ? localStorage : memoryFallback;
      let total = 0;
      try {
        if (persistent) {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            total += (localStorage.getItem(k) || "").length;
          }
        } else {
          for (let k in memoryFallback) total += (memoryFallback[k] || "").length;
        }
      } catch (e) { /* ignore */ }
      return total;
    },
  };

  // Higher-level helpers that auto-warn on failure
  safeStorage.loadJSON = (key, defaultValue) => safeStorage.get(key, defaultValue);

  safeStorage.saveJSON = (key, value) => {
    const ok = safeStorage.set(key, value);
    if (!ok && typeof window !== "undefined" && typeof window.showToast === "function") {
      window.showToast("💾 存储空间已满，部分进度可能无法保存", "warning", 4000);
    }
    return ok;
  };

  window.safeStorage = safeStorage;
})();
