// Learning stats + spaced repetition (SM-2 algorithm).
// Exposed as window.learningEngine. Depends on window.safeStorage.

(function () {
  const STATS_KEY = "learningStats";
  const SRS_KEY = "srsData";

  // ─── Stats ───────────────────────────────────────────────
  // Tracks: total sessions, daily activity (for streak), total items practiced,
  // correct/incorrect counts, per-day per-category breakdown.
  const defaultStats = () => ({
    firstUse: new Date().toDateString(),
    totalSessions: 0,
    totalItems: 0,
    totalCorrect: 0,
    totalWrong: 0,
    dailyActivity: {},  // "Mon Jul 20 2026" -> { count, correct, wrong }
    aiCalls: 0,
  });

  function today() { return new Date().toDateString(); }

  function loadStats() {
    return Object.assign(defaultStats(), safeStorage.loadJSON(STATS_KEY, {}) || {});
  }

  function saveStats(s) {
    safeStorage.saveJSON(STATS_KEY, s);
  }

  function recordActivity(correctCount, wrongCount) {
    const s = loadStats();
    const day = today();
    if (!s.dailyActivity[day]) {
      s.dailyActivity[day] = { count: 0, correct: 0, wrong: 0 };
    }
    const items = correctCount + wrongCount;
    s.dailyActivity[day].count += items;
    s.dailyActivity[day].correct += correctCount;
    s.dailyActivity[day].wrong += wrongCount;
    s.totalItems += items;
    s.totalCorrect += correctCount;
    s.totalWrong += wrongCount;
    // Count a session once per day
    if (!s.dailyActivity[day].sessionCounted) {
      s.totalSessions += 1;
      s.dailyActivity[day].sessionCounted = true;
    }
    saveStats(s);
  }

  function incrementAICalls() {
    const s = loadStats();
    s.aiCalls = (s.aiCalls || 0) + 1;
    saveStats(s);
  }

  // Compute current streak in days (consecutive days with activity up to today)
  function computeStreak() {
    const s = loadStats();
    const days = Object.keys(s.dailyActivity || {}).filter(d => s.dailyActivity[d].count > 0);
    if (days.length === 0) return 0;
    // Walk backwards from today
    let streak = 0;
    const cursor = new Date();
    // If no activity today, streak starts from yesterday (grace for "today not done")
    if (!s.dailyActivity[today()]) cursor.setDate(cursor.getDate() - 1);
    while (true) {
      const ds = cursor.toDateString();
      if (s.dailyActivity[ds] && s.dailyActivity[ds].count > 0) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }
    return streak;
  }

  // Get last N days summary for chart (oldest first)
  function lastNDays(n) {
    const s = loadStats();
    const out = [];
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - (n - 1));
    for (let i = 0; i < n; i++) {
      const ds = cursor.toDateString();
      const a = s.dailyActivity[ds] || { count: 0, correct: 0, wrong: 0 };
      // Short label like "周一" "Sun"
      const label = cursor.toLocaleDateString("zh-CN", { weekday: "short" });
      out.push({ label, day: ds, ...a });
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }

  // ─── Spaced Repetition (SM-2 simplified) ─────────────────
  // For each item key (e.g. "abc:apple"), store:
  //   { ef: ease factor (1.3-2.5), interval: days, reps, nextReview: timestamp }
  const defaultSRSItem = () => ({ ef: 2.5, interval: 0, reps: 0, nextReview: 0 });

  function loadSRS() {
    return safeStorage.loadJSON(SRS_KEY, {}) || {};
  }

  function saveSRS(data) {
    safeStorage.saveJSON(SRS_KEY, data);
  }

  // score: 0-5 (we map our 1-3 stars: 1→1, 2→3, 3→5)
  function updateSRS(key, starScore) {
    const data = loadSRS();
    const item = Object.assign(defaultSRSItem(), data[key] || {});
    // Map 1-3 stars to SM-2 quality (0-5)
    const q = starScore === 3 ? 5 : starScore === 2 ? 3 : 1;

    // Update ease factor
    item.ef = Math.max(1.3, item.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

    if (q < 3) {
      // Failed — reset
      item.interval = 0;
      item.reps = 0;
    } else {
      item.reps += 1;
      if (item.reps === 1) item.interval = 1;
      else if (item.reps === 2) item.interval = 3;
      else item.interval = Math.round(item.interval * item.ef);
    }

    const now = Date.now();
    item.nextReview = now + item.interval * 24 * 60 * 60 * 1000;
    item.lastSeen = now;

    data[key] = item;
    saveSRS(data);
    return item;
  }

  // Returns true if the SRS says this item is due for review now
  function isDue(key) {
    const data = loadSRS();
    const item = data[key];
    if (!item) return false;
    return Date.now() >= (item.nextReview || 0);
  }

  // Get the next-review date for display
  function nextReviewDate(key) {
    const data = loadSRS();
    const item = data[key];
    return item ? new Date(item.nextReview) : null;
  }

  // ─── Public API ──────────────────────────────────────────
  window.learningEngine = {
    recordActivity,
    incrementAICalls,
    computeStreak,
    lastNDays,
    loadStats,
    updateSRS,
    isDue,
    nextReviewDate,
    loadSRS,
  };
})();
