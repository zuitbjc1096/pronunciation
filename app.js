(() => {
  // ═══════════════════════════════════
  //  Shared utilities
  // ═══════════════════════════════════

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const hasSpeechRecognition = !!SpeechRecognition;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  let iosAudioUnlocked = false;
  function unlockIOSAudio() {
    if (iosAudioUnlocked || !isIOS) return;
    const u = new SpeechSynthesisUtterance("");
    u.volume = 0;
    window.speechSynthesis.speak(u);
    iosAudioUnlocked = true;
  }

  function speak(text, rate = 0.85) {
    return new Promise(resolve => {
      window.speechSynthesis.cancel();
      const delay = isIOS ? 100 : 0;
      setTimeout(() => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-US";
        u.rate = rate;
        u.pitch = 1.1;
        const voices = window.speechSynthesis.getVoices();
        const pref = voices.find(v => v.lang.startsWith("en") && v.name.includes("Samantha"))
                  || voices.find(v => v.lang.startsWith("en-US"))
                  || voices.find(v => v.lang.startsWith("en"));
        if (pref) u.voice = pref;
        u.onend = resolve;
        u.onerror = resolve;
        window.speechSynthesis.speak(u);
        if (isIOS) {
          const ka = setInterval(() => {
            if (!window.speechSynthesis.speaking) { clearInterval(ka); return; }
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }, 5000);
        }
      }, delay);
    });
  }

  function levenshteinSimilarity(a, b) {
    if (a === b) return 1;
    if (!a.length || !b.length) return 0;
    const m = [];
    for (let i = 0; i <= b.length; i++) m[i] = [i];
    for (let j = 0; j <= a.length; j++) m[0][j] = j;
    for (let i = 1; i <= b.length; i++)
      for (let j = 1; j <= a.length; j++) {
        const c = b[i-1] === a[j-1] ? 0 : 1;
        m[i][j] = Math.min(m[i-1][j]+1, m[i][j-1]+1, m[i-1][j-1]+c);
      }
    return 1 - m[b.length][a.length] / Math.max(a.length, b.length);
  }

  function celebrate() {
    const el = document.createElement("div");
    el.className = "celebration";
    document.body.appendChild(el);
    const emojis = ["🎉","🌟","✨","🎊","💫","🥳","👏","🏆"];
    for (let i = 0; i < 20; i++) {
      const s = document.createElement("span");
      s.className = "confetti";
      s.textContent = emojis[Math.floor(Math.random()*emojis.length)];
      s.style.left = Math.random()*100+"%";
      s.style.animationDelay = Math.random()*0.6+"s";
      el.appendChild(s);
    }
    setTimeout(() => el.remove(), 2500);
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function calcScore(results, target) {
    const t = target.toLowerCase().replace(/[^a-z' ]/g, "").trim();
    let best = 0;
    for (const r of results) {
      const sim = levenshteinSimilarity(r.text, t);
      const combined = sim * 0.7 + r.confidence * 0.3;
      if (combined > best) best = combined;
    }
    if (best >= 0.75) return 3;
    if (best >= 0.45) return 2;
    return 1;
  }

  // FIX: doRecognition now calls onFallback when no speech detected (timeout with no result)
  // enhancement: distinguish permission-denied from other errors via a typed callback
  function doRecognition(onResult, onFallback, $recBtn, $recIndicator, onPermissionDenied) {
    if (!hasSpeechRecognition) { onFallback(); return; }

    let rec, recording = true, gotResult = false;
    try {
      rec = new SpeechRecognition();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 5;
      rec.continuous = false;
    } catch (e) { onFallback(); return; }

    if ($recBtn) $recBtn.style.display = "none";
    if ($recIndicator) $recIndicator.style.display = "block";

    rec.onresult = (ev) => {
      gotResult = true;
      recording = false;
      if ($recIndicator) $recIndicator.style.display = "none";
      const results = [];
      for (let i = 0; i < ev.results[0].length; i++) {
        results.push({
          text: ev.results[0][i].transcript.toLowerCase().replace(/[^a-z' ]/g, "").trim(),
          confidence: ev.results[0][i].confidence,
        });
      }
      onResult(results);
    };

    rec.onerror = (ev) => {
      recording = false;
      if ($recIndicator) $recIndicator.style.display = "none";
      if ($recBtn) $recBtn.style.display = "flex";
      // Distinguish permission denial from generic errors
      const errType = ev && ev.error;
      if (errType === "not-allowed" || errType === "service-not-allowed") {
        if (onPermissionDenied) onPermissionDenied();
        else onFallback();
      } else {
        onFallback();
      }
    };

    rec.onend = () => {
      if (recording) {
        recording = false;
        if ($recIndicator) $recIndicator.style.display = "none";
        if (!gotResult) {
          onFallback();
        } else {
          if ($recBtn) $recBtn.style.display = "flex";
        }
      }
    };

    try { rec.start(); } catch (e) { onFallback(); return; }
    setTimeout(() => { if (recording) { try { rec.stop(); } catch(e){} } }, 5000);
  }

  // ═══════════════════════════════════
  //  Toast notifications (global feedback UI)
  // ═══════════════════════════════════

  function ensureToastContainer() {
    let el = document.getElementById("toast-container");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast-container";
      el.className = "toast-container";
      el.setAttribute("aria-live", "polite");
      el.setAttribute("aria-atomic", "true");
      document.body.appendChild(el);
    }
    return el;
  }

  function showToast(message, type = "info", duration = 3000) {
    const container = ensureToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  // Standardized handler shown to the user when mic permission is denied
  function handleMicDenied() {
    showToast("🎤 麦克风被禁用，已切换到家长打分模式", "warning", 3500);
    // Show a one-time banner-style hint (less intrusive than alert)
    if (!sessionStorage.getItem("micPermHintShown")) {
      sessionStorage.setItem("micPermHintShown", "1");
      setTimeout(() => {
        showToast("💡 提示：去系统设置 → 浏览器 → 开启麦克风权限，即可用语音识别", "info", 5000);
      }, 3600);
    }
  }

  function renderManualScore(container, onScore) {
    container.innerHTML = `
      <button class="manual-score" data-score="1">⭐</button>
      <button class="manual-score" data-score="2">⭐⭐</button>
      <button class="manual-score" data-score="3">⭐⭐⭐</button>
    `;
    container.querySelectorAll(".manual-score").forEach(btn => {
      btn.addEventListener("click", () => onScore(parseInt(btn.dataset.score)));
    });
  }

  function showScoreUI($stars, $msg, score) {
    if (score === 3) {
      $stars.textContent = "⭐⭐⭐";
      $msg.textContent = "Excellent! 太棒了！";
      $msg.className = "score-message perfect";
      celebrate();
    } else if (score === 2) {
      $stars.textContent = "⭐⭐";
      $msg.textContent = "Good job! 不错哦！";
      $msg.className = "score-message good";
    } else {
      $stars.textContent = "⭐";
      $msg.textContent = "Try again! 再加油！";
      $msg.className = "score-message try-again";
    }
  }

  // ═══════════════════════════════════
  //  DOM cache + shared UI helpers (used by all practice modules)
  // ═══════════════════════════════════

  const $cache = {};
  function $(id) {
    return $cache[id] || ($cache[id] = document.getElementById(id));
  }

  // Escape dynamic text before injecting into innerHTML (XSS defense)
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  // A "scoring DOM bundle" describes the shared UI surface that every practice
  // module exposes: record button, recording indicator, feedback panel, score
  // stars/message, optional answer reveal area, retry/next buttons.
  // These helpers operate on such a bundle so each module doesn't repeat the
  // same style.display / className / renderManualScore boilerplate.

  function manualFallbackUI(dom, onScore) {
    dom.recBtn.style.display = "none";
    dom.recInd.style.display = "none";
    dom.feedback.style.display = "flex";
    dom.fbMsg.textContent = "家长请打分：";
    dom.fbMsg.className = "score-message";
    if (dom.fbAnswer) dom.fbAnswer.style.display = "none";
    if (dom.aiHelp) dom.aiHelp.style.display = "none";
    dom.retry.style.display = "none";
    dom.next.style.display = "none";
    renderManualScore(dom.fbStars, onScore);
  }

  function showFeedbackUI(dom, score) {
    dom.recBtn.style.display = "none";
    dom.feedback.style.display = "flex";
    dom.retry.style.display = "inline-block";
    dom.next.style.display = "inline-block";
    showScoreUI(dom.fbStars, dom.fbMsg, score);
  }

  function prepareNextItemUI(dom) {
    dom.recBtn.style.display = "flex";
    dom.recInd.style.display = "none";
    dom.feedback.style.display = "none";
    if (dom.fbAnswer) dom.fbAnswer.style.display = "none";
    if (dom.aiHelp) dom.aiHelp.style.display = "none";
  }

  // ═══════════════════════════════════
  //  Mistake Book (错题集)
  // ═══════════════════════════════════

  const MISTAKES_KEY = "mistakeBook";

  function loadMistakes() {
    try {
      return JSON.parse(localStorage.getItem(MISTAKES_KEY)) || { abc: [], quiz: [], dialogue: [] };
    } catch (e) {
      return { abc: [], quiz: [], dialogue: [] };
    }
  }

  function saveMistakes(data) {
    localStorage.setItem(MISTAKES_KEY, JSON.stringify(data));
    updateMistakeBadge();
  }

  function addMistake(type, item) {
    const data = loadMistakes();
    const list = data[type];
    const key = type === "abc" ? item.word : item.en;
    if (!list.some(m => (type === "abc" ? m.word : m.en) === key)) {
      list.push(item);
      saveMistakes(data);
    }
  }

  function removeMistake(type, key) {
    const data = loadMistakes();
    const field = type === "abc" ? "word" : "en";
    data[type] = data[type].filter(m => m[field] !== key);
    saveMistakes(data);
  }

  function getTotalMistakes() {
    const d = loadMistakes();
    return d.abc.length + d.quiz.length + d.dialogue.length;
  }

  function updateMistakeBadge() {
    const badge = document.getElementById("mistake-badge");
    const total = getTotalMistakes();
    if (total > 0) {
      badge.textContent = total;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  }

  // ═══════════════════════════════════
  //  Screen management
  // ═══════════════════════════════════

  const allScreens = {};
  document.querySelectorAll(".screen").forEach(s => { allScreens[s.id.replace("screen-", "")] = s; });

  function showScreen(name) {
    Object.values(allScreens).forEach(s => s.classList.remove("active"));
    allScreens[name].classList.add("active");
    window.scrollTo(0, 0);
    if (name === "menu") updateMistakeBadge();
  }

  // Back buttons (generic — skip practice screen, handled separately)
  document.querySelectorAll(".btn-back[data-go]").forEach(btn => {
    const parentScreen = btn.closest(".screen");
    if (parentScreen && parentScreen.id === "screen-practice") return;
    btn.addEventListener("click", () => {
      window.speechSynthesis.cancel();
      showScreen(btn.dataset.go);
    });
  });

  // ═══════════════════════════════════
  //  Main Menu
  // ═══════════════════════════════════

  document.querySelectorAll(".menu-card").forEach(card => {
    card.addEventListener("click", () => {
      unlockIOSAudio();
      const mod = card.dataset.module;
      if (mod === "course") { buildCourseLevels(); showScreen("course"); }
      else if (mod === "abc") { buildLetterGrid(); showScreen("abc"); }
      else if (mod === "quiz") { buildQuizCategories(); showScreen("quiz-menu"); }
      else if (mod === "dialogue") { buildDialogueScenes(); showScreen("dialogue-menu"); }
      else if (mod === "mistakes") { buildMistakesScreen(); showScreen("mistakes"); }
    });
  });

  // ═══════════════════════════════════
  //  MODULE 1: ABC Letter Practice
  // ═══════════════════════════════════

  const completedLetters = new Set(JSON.parse(localStorage.getItem("completedLetters") || "[]"));
  let abcLetter = null, abcWordIdx = 0, abcScores = {};
  // Local working set of words for the current session — never mutates LETTER_DATA.
  // Initialized from LETTER_DATA on start, may be replaced with a weak-word subset on retry.
  let abcWords = [];

  const $grid = document.getElementById("letter-grid");
  const $stepLetter = document.getElementById("step-letter");
  const $stepWord = document.getElementById("step-word");
  const $bigLetter = document.getElementById("current-letter");
  const $progressFill = document.getElementById("progress-fill");
  const $wordEmoji = document.getElementById("word-emoji");
  const $wordText = document.getElementById("word-text");
  const $btnRecord = document.getElementById("btn-record");
  const $recIndicator = document.getElementById("recording-indicator");
  const $scoreDisplay = document.getElementById("score-display");
  const $scoreStars = document.getElementById("score-stars");
  const $scoreMessage = document.getElementById("score-message");

  function buildLetterGrid() {
    $grid.innerHTML = "";
    Object.keys(LETTER_DATA).forEach((letter, i) => {
      const btn = document.createElement("button");
      btn.className = "letter-btn" + (completedLetters.has(letter) ? " completed" : "");
      btn.setAttribute("data-color", i % 10);
      btn.innerHTML = `<span class="letter-label">${letter}</span><span class="letter-status"></span>`;
      btn.addEventListener("click", () => abcStart(letter));
      $grid.appendChild(btn);
    });
  }

  function abcStart(letter) {
    abcLetter = letter;
    abcWordIdx = 0;
    abcScores = {};
    abcWords = LETTER_DATA[letter].words;   // shallow ref, never mutated
    showScreen("practice");
    $stepLetter.style.display = "flex";
    $stepWord.style.display = "none";
    $bigLetter.textContent = letter;
    abcUpdateProgress();
    setTimeout(() => speak(LETTER_DATA[letter].sound, 0.75), 200);
  }

  function abcUpdateProgress() {
    $progressFill.style.width = (abcWordIdx / abcWords.length * 100) + "%";
  }

  function abcShowWord() {
    const w = abcWords[abcWordIdx];
    $stepLetter.style.display = "none";
    $stepWord.style.display = "flex";
    $scoreDisplay.style.display = "none";
    $recIndicator.style.display = "none";
    $btnRecord.style.display = "flex";
    $wordEmoji.textContent = w.emoji;
    $wordText.textContent = w.word;
    abcUpdateProgress();
    speak(w.word, 0.75);
  }

  function abcDoRecord() {
    const target = abcWords[abcWordIdx].word;
    doRecognition(
      (results) => abcFinish(calcScore(results, target)),
      () => abcManualScore(),
      $btnRecord, $recIndicator,
      handleMicDenied
    );
  }

  function abcManualScore() {
    $btnRecord.style.display = "none";
    $recIndicator.style.display = "none";
    $scoreDisplay.style.display = "flex";
    $("btn-retry-word").style.display = "none";
    $("btn-next-word").style.display = "none";
    $scoreMessage.textContent = "家长请打分：";
    $scoreMessage.className = "score-message";
    renderManualScore($scoreStars, (s) => abcFinish(s));
  }

  function abcFinish(score) {
    const w = abcWords[abcWordIdx];
    abcScores[w.word] = score;

    if (score < 3) {
      addMistake("abc", { letter: abcLetter, word: w.word, emoji: w.emoji });
    } else {
      removeMistake("abc", w.word);
    }

    $btnRecord.style.display = "none";
    $scoreDisplay.style.display = "flex";
    $("btn-retry-word").style.display = "inline-block";
    $("btn-next-word").style.display = "inline-block";
    showScoreUI($scoreStars, $scoreMessage, score);
  }

  function abcNext() {
    abcWordIdx++;
    if (abcWordIdx >= abcWords.length) abcResults();
    else abcShowWord();
  }

  function abcResults() {
    showScreen("result");
    const weak = [];
    let allPerfect = true;
    const $t = $("result-title");
    const $s = $("result-summary");
    const $b = $("result-buttons");
    $s.innerHTML = "";
    abcWords.forEach(w => {
      const sc = abcScores[w.word] || 1;
      if (sc < 3) { weak.push(w); allPerfect = false; }
      $s.innerHTML += `<div class="result-item${sc<3?" needs-practice":""}">
        <div class="word-info"><span class="emoji">${w.emoji}</span><span>${escapeHtml(w.word)}</span></div>
        <span class="stars">${"⭐".repeat(sc)}</span></div>`;
    });
    if (allPerfect) {
      $t.textContent = "🎉 全部满分！太厉害了！";
      completedLetters.add(abcLetter);
      localStorage.setItem("completedLetters", JSON.stringify([...completedLetters]));
      celebrate();
    } else {
      $t.textContent = `字母 ${abcLetter} 练习完成！`;
    }
    $b.innerHTML = "";
    if (weak.length > 0) {
      const rb = document.createElement("button");
      rb.className = "btn-primary";
      rb.textContent = "🔄 重新练习不熟的单词";
      rb.addEventListener("click", () => {
        // Replace working set with the weak subset — no mutation of LETTER_DATA
        abcWords = weak;
        abcWordIdx = 0; abcScores = {};
        showScreen("practice");
        $stepLetter.style.display = "none";
        $stepWord.style.display = "flex";
        abcShowWord();
      });
      $b.appendChild(rb);
    }
    const letters = Object.keys(LETTER_DATA);
    const ni = letters.indexOf(abcLetter) + 1;
    if (ni < letters.length) {
      const nb = document.createElement("button");
      nb.className = weak.length > 0 ? "btn-secondary" : "btn-primary";
      nb.textContent = `下一个字母 ${letters[ni]} →`;
      nb.addEventListener("click", () => abcStart(letters[ni]));
      $b.appendChild(nb);
    }
    const hb = document.createElement("button");
    hb.className = "btn-secondary";
    hb.textContent = "🏠 回到主菜单";
    hb.addEventListener("click", () => showScreen("menu"));
    $b.appendChild(hb);
  }

  document.getElementById("btn-play-letter").addEventListener("click", () => {
    unlockIOSAudio();
    speak(LETTER_DATA[abcLetter].sound, 0.75);
  });
  document.getElementById("btn-next-to-word").addEventListener("click", () => abcShowWord());
  document.getElementById("btn-play-word").addEventListener("click", () => {
    unlockIOSAudio();
    speak(abcWords[abcWordIdx].word, 0.75);
  });
  $btnRecord.addEventListener("click", () => abcDoRecord());
  document.getElementById("btn-retry-word").addEventListener("click", () => {
    $scoreDisplay.style.display = "none";
    $btnRecord.style.display = "flex";
    speak(abcWords[abcWordIdx].word, 0.75);
  });
  document.getElementById("btn-next-word").addEventListener("click", () => abcNext());

  // Back button for the practice screen (no cleanup needed — LETTER_DATA is never mutated now)
  document.querySelector("#screen-practice .btn-back").addEventListener("click", () => {
    window.speechSynthesis.cancel();
    buildLetterGrid();
    showScreen("abc");
  });

  // ═══════════════════════════════════
  //  MODULE 2: Quiz (看图说英语)
  // ═══════════════════════════════════

  let quizCategory = null, quizItems = [], quizIdx = 0, quizScores = [];
  const QUIZ_PER_ROUND = 5;

  // Centralized DOM bundle for the Quiz module (cached once, reused everywhere)
  const quizDom = {
    emoji: $("quiz-emoji"),
    prompt: $("quiz-prompt"),
    playHint: $("quiz-play-hint"),
    recBtn: $("quiz-record"),
    recInd: $("quiz-rec-indicator"),
    feedback: $("quiz-feedback"),
    fbStars: $("quiz-fb-stars"),
    fbMsg: $("quiz-fb-msg"),
    fbAnswer: $("quiz-fb-answer"),
    progressFill: $("quiz-progress-fill"),
    counter: $("quiz-counter"),
    retry: $("quiz-retry"),
    next: $("quiz-next"),
  };

  function buildQuizCategories() {
    const grid = $("quiz-category-grid");
    grid.innerHTML = "";
    QUIZ_CATEGORIES.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "category-card";
      btn.style.background = cat.color;
      btn.innerHTML = `
        <span class="cat-icon">${cat.icon}</span>
        <span class="cat-name">${cat.name}</span>
        <span class="cat-name-en">${cat.nameEn}</span>
        <span class="cat-count">${cat.items.length} 个词</span>
      `;
      btn.addEventListener("click", () => quizStart(cat));
      grid.appendChild(btn);
    });
  }

  function quizStart(cat) {
    quizCategory = cat;
    quizItems = shuffle(cat.items).slice(0, QUIZ_PER_ROUND);
    quizIdx = 0;
    quizScores = [];
    showScreen("quiz");
    quizShowItem();
  }

  function quizShowItem() {
    const item = quizItems[quizIdx];
    quizDom.emoji.textContent = item.emoji;
    quizDom.prompt.innerHTML = `这是什么？<br><span style="font-size:1rem;color:#999">用英语说出它的名字</span>`;
    prepareNextItemUI(quizDom);
    quizDom.progressFill.style.width = (quizIdx / quizItems.length * 100) + "%";
    quizDom.counter.textContent = `${quizIdx + 1}/${quizItems.length}`;
  }

  function quizDoRecord() {
    unlockIOSAudio();
    const item = quizItems[quizIdx];
    doRecognition(
      (results) => quizShowFeedback(calcScore(results, item.en)),
      () => manualFallbackUI(quizDom, (s) => quizShowFeedback(s)),
      quizDom.recBtn, quizDom.recInd,
      handleMicDenied
    );
  }

  function quizShowFeedback(score) {
    const item = quizItems[quizIdx];
    quizScores[quizIdx] = score;

    if (score < 3) {
      addMistake("quiz", { en: item.en, cn: item.cn, emoji: item.emoji, category: quizCategory.id });
    } else {
      removeMistake("quiz", item.en);
    }

    showFeedbackUI(quizDom, score);

    if (score < 3) {
      quizDom.fbAnswer.style.display = "block";
      quizDom.fbAnswer.innerHTML = `正确答案：<strong>${escapeHtml(item.en)}</strong>（${escapeHtml(item.cn)}）`;
      quizDom.playHint.style.display = "inline-block";
      speak(item.en, 0.7);
    } else {
      quizDom.fbAnswer.style.display = "none";
      quizDom.playHint.style.display = "none";
    }
  }

  function quizNext() {
    quizIdx++;
    if (quizIdx >= quizItems.length) quizResults();
    else quizShowItem();
  }

  function quizResults() {
    showScreen("result");
    const $t = document.getElementById("result-title");
    const $s = document.getElementById("result-summary");
    const $b = document.getElementById("result-buttons");
    let total = 0;
    $s.innerHTML = "";
    quizItems.forEach((item, i) => {
      const sc = quizScores[i] || 1;
      total += sc;
      $s.innerHTML += `<div class="result-item${sc<3?" needs-practice":""}">
        <div class="word-info"><span class="emoji">${item.emoji}</span><span>${item.en} (${item.cn})</span></div>
        <span class="stars">${"⭐".repeat(sc)}</span></div>`;
    });
    const avg = total / quizItems.length;
    if (avg >= 2.8) { $t.textContent = "🎉 太厉害了！全都认识！"; celebrate(); }
    else if (avg >= 2) { $t.textContent = "👍 不错！继续加油！"; }
    else { $t.textContent = "💪 多练习就会更好！"; }

    $b.innerHTML = "";
    const weak = quizItems.filter((_, i) => (quizScores[i] || 1) < 3);
    if (weak.length > 0) {
      const rb = document.createElement("button");
      rb.className = "btn-primary";
      rb.textContent = "🔄 重新练习不熟的词";
      rb.addEventListener("click", () => {
        quizItems = weak; quizIdx = 0; quizScores = [];
        showScreen("quiz"); quizShowItem();
      });
      $b.appendChild(rb);
    }
    const ab = document.createElement("button");
    ab.className = weak.length > 0 ? "btn-secondary" : "btn-primary";
    ab.textContent = `🔄 再来一轮 ${quizCategory.name}`;
    ab.addEventListener("click", () => quizStart(quizCategory));
    $b.appendChild(ab);
    const hb = document.createElement("button");
    hb.className = "btn-secondary";
    hb.textContent = "🏠 回到主菜单";
    hb.addEventListener("click", () => showScreen("menu"));
    $b.appendChild(hb);
  }

  quizDom.recBtn.addEventListener("click", () => quizDoRecord());
  quizDom.playHint.addEventListener("click", () => { unlockIOSAudio(); speak(quizItems[quizIdx].en, 0.7); });
  quizDom.retry.addEventListener("click", () => {
    quizDom.feedback.style.display = "none"; quizDom.recBtn.style.display = "flex";
  });
  quizDom.next.addEventListener("click", () => quizNext());

  // ═══════════════════════════════════
  //  MODULE 3: Dialogue (日常对话跟读)
  // ═══════════════════════════════════

  let dlgScene = null, dlgItems = [], dlgIdx = 0, dlgScores = [];

  // Centralized DOM bundle for the Dialogue module
  const dlgDom = {
    cn: $("dlg-cn-text"),
    en: $("dlg-en-text"),
    play: $("dlg-play"),
    recBtn: $("dlg-record"),
    recInd: $("dlg-rec-indicator"),
    feedback: $("dlg-feedback"),
    fbStars: $("dlg-fb-stars"),
    fbMsg: $("dlg-fb-msg"),
    progressFill: $("dlg-progress-fill"),
    counter: $("dlg-counter"),
    retry: $("dlg-retry"),
    next: $("dlg-next"),
  };

  function buildDialogueScenes() {
    const grid = $("dialogue-scene-grid");
    grid.innerHTML = "";
    DIALOGUE_SCENES.forEach(scene => {
      const btn = document.createElement("button");
      btn.className = "category-card";
      btn.style.background = scene.color;
      btn.innerHTML = `
        <span class="cat-icon">${scene.icon}</span>
        <span class="cat-name">${scene.name}</span>
        <span class="cat-name-en">${scene.nameEn}</span>
        <span class="cat-count">${scene.dialogues.length} 句</span>
      `;
      btn.addEventListener("click", () => dlgStart(scene));
      grid.appendChild(btn);
    });
  }

  function dlgStart(scene) {
    dlgScene = scene;
    dlgItems = scene.dialogues;
    dlgIdx = 0;
    dlgScores = [];
    showScreen("dialogue");
    dlgShowItem();
  }

  function dlgShowItem() {
    const item = dlgItems[dlgIdx];
    dlgDom.cn.textContent = item.cn;
    dlgDom.en.textContent = item.en;
    prepareNextItemUI(dlgDom);
    dlgDom.progressFill.style.width = (dlgIdx / dlgItems.length * 100) + "%";
    dlgDom.counter.textContent = `${dlgIdx + 1}/${dlgItems.length}`;
    setTimeout(() => speak(item.en, 0.7), 300);
  }

  function dlgDoRecord() {
    unlockIOSAudio();
    const item = dlgItems[dlgIdx];
    doRecognition(
      (results) => dlgShowFeedback(calcScore(results, item.en)),
      () => manualFallbackUI(dlgDom, (s) => dlgShowFeedback(s)),
      dlgDom.recBtn, dlgDom.recInd,
      handleMicDenied
    );
  }

  function dlgShowFeedback(score) {
    const item = dlgItems[dlgIdx];
    dlgScores[dlgIdx] = score;

    if (score < 3) {
      addMistake("dialogue", { en: item.en, cn: item.cn, scene: dlgScene.id });
    } else {
      removeMistake("dialogue", item.en);
    }

    showFeedbackUI(dlgDom, score);
  }

  function dlgNext() {
    dlgIdx++;
    if (dlgIdx >= dlgItems.length) dlgResults();
    else dlgShowItem();
  }

  function dlgResults() {
    showScreen("result");
    const $t = document.getElementById("result-title");
    const $s = document.getElementById("result-summary");
    const $b = document.getElementById("result-buttons");
    let total = 0;
    $s.innerHTML = "";
    dlgItems.forEach((item, i) => {
      const sc = dlgScores[i] || 1;
      total += sc;
      $s.innerHTML += `<div class="result-item${sc<3?" needs-practice":""}">
        <div class="word-info"><span>${item.en}</span></div>
        <span class="stars">${"⭐".repeat(sc)}</span></div>`;
    });
    const avg = total / dlgItems.length;
    if (avg >= 2.8) { $t.textContent = "🎉 发音超棒！全部满分！"; celebrate(); }
    else if (avg >= 2) { $t.textContent = "👍 说得不错！继续加油！"; }
    else { $t.textContent = "💪 多听多读就会更好！"; }

    $b.innerHTML = "";
    const weak = dlgItems.filter((_, i) => (dlgScores[i] || 1) < 3);
    if (weak.length > 0) {
      const rb = document.createElement("button");
      rb.className = "btn-primary";
      rb.textContent = "🔄 重新练习不熟的句子";
      rb.addEventListener("click", () => {
        dlgItems = weak; dlgIdx = 0; dlgScores = [];
        showScreen("dialogue"); dlgShowItem();
      });
      $b.appendChild(rb);
    }
    const ab = document.createElement("button");
    ab.className = weak.length > 0 ? "btn-secondary" : "btn-primary";
    ab.textContent = "📋 选择其他场景";
    ab.addEventListener("click", () => { buildDialogueScenes(); showScreen("dialogue-menu"); });
    $b.appendChild(ab);
    const hb = document.createElement("button");
    hb.className = "btn-secondary";
    hb.textContent = "🏠 回到主菜单";
    hb.addEventListener("click", () => showScreen("menu"));
    $b.appendChild(hb);
  }

  dlgDom.play.addEventListener("click", () => { unlockIOSAudio(); speak(dlgItems[dlgIdx].en, 0.7); });
  dlgDom.recBtn.addEventListener("click", () => dlgDoRecord());
  dlgDom.retry.addEventListener("click", () => {
    dlgDom.feedback.style.display = "none"; dlgDom.recBtn.style.display = "flex";
    speak(dlgItems[dlgIdx].en, 0.7);
  });
  dlgDom.next.addEventListener("click", () => dlgNext());

  // ═══════════════════════════════════
  //  MODULE 4: Mistake Book (错题集页面)
  // ═══════════════════════════════════

  let mpType = null, mpItems = [], mpIdx = 0, mpScores = [];

  // Centralized DOM bundle for Mistakes-Practice module
  const mpDom = {
    emoji: $("mp-emoji"),
    prompt: $("mp-prompt"),
    play: $("mp-play"),
    recBtn: $("mp-record"),
    recInd: $("mp-rec-indicator"),
    feedback: $("mp-feedback"),
    fbStars: $("mp-fb-stars"),
    fbMsg: $("mp-fb-msg"),
    fbAnswer: $("mp-fb-answer"),
    progressFill: $("mp-progress-fill"),
    counter: $("mp-counter"),
    retry: $("mp-retry"),
    next: $("mp-next"),
  };

  function buildMistakesScreen() {
    const data = loadMistakes();
    const $content = document.getElementById("mistakes-content");
    const total = data.abc.length + data.quiz.length + data.dialogue.length;

    if (total === 0) {
      $content.innerHTML = `
        <div class="mistakes-empty">
          <div class="mistakes-empty-icon">🎉</div>
          <p class="mistakes-empty-text">太棒了！没有错题！</p>
        </div>`;
      return;
    }

    let html = "";

    if (data.abc.length > 0) {
      html += `<div class="mistakes-section">
        <div class="mistakes-section-header">
          <span class="mistakes-section-title">🔤 ABC 发音</span>
          <span class="mistakes-section-count">${data.abc.length} 个</span>
        </div>
        <div class="mistake-list">
          ${data.abc.map(m => `<span class="mistake-tag"><span class="tag-emoji">${m.emoji}</span>${m.word}</span>`).join("")}
        </div>
        <button class="btn-practice-mistakes" data-type="abc">开始练习</button>
      </div>`;
    }

    if (data.quiz.length > 0) {
      html += `<div class="mistakes-section">
        <div class="mistakes-section-header">
          <span class="mistakes-section-title">🧠 看图说英语</span>
          <span class="mistakes-section-count">${data.quiz.length} 个</span>
        </div>
        <div class="mistake-list">
          ${data.quiz.map(m => `<span class="mistake-tag"><span class="tag-emoji">${m.emoji}</span>${m.en}</span>`).join("")}
        </div>
        <button class="btn-practice-mistakes" data-type="quiz">开始练习</button>
      </div>`;
    }

    if (data.dialogue.length > 0) {
      html += `<div class="mistakes-section">
        <div class="mistakes-section-header">
          <span class="mistakes-section-title">💬 日常对话</span>
          <span class="mistakes-section-count">${data.dialogue.length} 句</span>
        </div>
        <div class="mistake-list">
          ${data.dialogue.map(m => `<span class="mistake-tag">${m.en}</span>`).join("")}
        </div>
        <button class="btn-practice-mistakes" data-type="dialogue">开始练习</button>
      </div>`;
    }

    html += `<div style="text-align:center;padding:20px 0">
      <button class="btn-clear-mistakes">🗑️ 清空全部错题</button>
    </div>`;

    $content.innerHTML = html;

    $content.querySelectorAll(".btn-practice-mistakes").forEach(btn => {
      btn.addEventListener("click", () => mpStart(btn.dataset.type));
    });

    const clearBtn = $content.querySelector(".btn-clear-mistakes");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        saveMistakes({ abc: [], quiz: [], dialogue: [] });
        buildMistakesScreen();
      });
    }
  }

  function mpStart(type) {
    const data = loadMistakes();
    mpType = type;
    mpItems = [...data[type]];
    mpIdx = 0;
    mpScores = [];
    showScreen("mistakes-practice");
    mpShowItem();
  }

  function mpShowItem() {
    const item = mpItems[mpIdx];
    prepareNextItemUI(mpDom);
    mpDom.progressFill.style.width = (mpIdx / mpItems.length * 100) + "%";
    mpDom.counter.textContent = `${mpIdx + 1}/${mpItems.length}`;

    if (mpType === "abc") {
      mpDom.emoji.textContent = item.emoji;
      mpDom.prompt.innerHTML = `字母 <strong>${escapeHtml(item.letter)}</strong> 的单词`;
      mpDom.play.onclick = () => { unlockIOSAudio(); speak(item.word, 0.7); };
      setTimeout(() => speak(item.word, 0.7), 300);
    } else if (mpType === "quiz") {
      mpDom.emoji.textContent = item.emoji;
      mpDom.prompt.innerHTML = `这是什么？<br><span style="font-size:1rem;color:#999">${escapeHtml(item.cn)}</span>`;
      mpDom.play.onclick = () => { unlockIOSAudio(); speak(item.en, 0.7); };
    } else {
      mpDom.emoji.textContent = "💬";
      mpDom.prompt.innerHTML = `<span style="font-size:1.1rem">${escapeHtml(item.cn)}</span><br><span style="color:var(--primary);font-weight:700">${escapeHtml(item.en)}</span>`;
      mpDom.play.onclick = () => { unlockIOSAudio(); speak(item.en, 0.7); };
      setTimeout(() => speak(item.en, 0.7), 300);
    }
  }

  function mpDoRecord() {
    unlockIOSAudio();
    const item = mpItems[mpIdx];
    const target = mpType === "abc" ? item.word : item.en;
    doRecognition(
      (results) => mpShowFeedback(calcScore(results, target)),
      () => manualFallbackUI(mpDom, (s) => mpShowFeedback(s)),
      mpDom.recBtn, mpDom.recInd,
      handleMicDenied
    );
  }

  function mpShowFeedback(score) {
    const item = mpItems[mpIdx];
    mpScores[mpIdx] = score;

    const key = mpType === "abc" ? item.word : item.en;
    if (score >= 3) {
      removeMistake(mpType, key);
    }

    showFeedbackUI(mpDom, score);

    if (score < 3) {
      const answer = mpType === "abc" ? item.word : item.en;
      const extra = mpType === "quiz" ? `（${escapeHtml(item.cn)}）` : "";
      mpDom.fbAnswer.style.display = "block";
      mpDom.fbAnswer.innerHTML = `正确答案：<strong>${escapeHtml(answer)}</strong>${extra}`;
      speak(answer, 0.7);
    } else {
      mpDom.fbAnswer.style.display = "none";
    }
  }

  function mpNext() {
    mpIdx++;
    if (mpIdx >= mpItems.length) mpResults();
    else mpShowItem();
  }

  function mpResults() {
    showScreen("result");
    const $t = document.getElementById("result-title");
    const $s = document.getElementById("result-summary");
    const $b = document.getElementById("result-buttons");

    const labels = { abc: "🔤 ABC 发音", quiz: "🧠 看图说英语", dialogue: "💬 日常对话" };
    let cleared = 0, total = 0;
    $s.innerHTML = "";
    mpItems.forEach((item, i) => {
      const sc = mpScores[i] || 1;
      total += sc;
      if (sc >= 3) cleared++;
      const label = mpType === "abc" ? item.word : item.en;
      const emoji = item.emoji || "💬";
      $s.innerHTML += `<div class="result-item${sc<3?" needs-practice":""}">
        <div class="word-info"><span class="emoji">${emoji}</span><span>${label}</span></div>
        <span class="stars">${"⭐".repeat(sc)}${sc>=3?" ✅":""}</span></div>`;
    });

    if (cleared === mpItems.length) {
      $t.textContent = "🎉 全部过关！已从错题集移除！";
      celebrate();
    } else {
      $t.textContent = `${labels[mpType]} 错题练习完成`;
    }

    $b.innerHTML = "";
    const remaining = loadMistakes()[mpType];
    if (remaining.length > 0) {
      const rb = document.createElement("button");
      rb.className = "btn-primary";
      rb.textContent = `🔄 继续练习剩余 ${remaining.length} 题`;
      rb.addEventListener("click", () => mpStart(mpType));
      $b.appendChild(rb);
    }
    const hb2 = document.createElement("button");
    hb2.className = remaining.length > 0 ? "btn-secondary" : "btn-primary";
    hb2.textContent = "📝 返回错题集";
    hb2.addEventListener("click", () => { buildMistakesScreen(); showScreen("mistakes"); });
    $b.appendChild(hb2);
    const hb = document.createElement("button");
    hb.className = "btn-secondary";
    hb.textContent = "🏠 回到主菜单";
    hb.addEventListener("click", () => showScreen("menu"));
    $b.appendChild(hb);
  }

  mpDom.recBtn.addEventListener("click", () => mpDoRecord());
  mpDom.retry.addEventListener("click", () => {
    mpDom.feedback.style.display = "none";
    mpDom.recBtn.style.display = "flex";
    const item = mpItems[mpIdx];
    speak(mpType === "abc" ? item.word : item.en, 0.7);
  });
  mpDom.next.addEventListener("click", () => mpNext());
  $("mp-back").addEventListener("click", () => {
    window.speechSynthesis.cancel();
    buildMistakesScreen();
    showScreen("mistakes");
  });

  // ═══════════════════════════════════
  //  MODULE 5: 分级课程
  // ═══════════════════════════════════

  const COURSE_PROGRESS_KEY = "courseProgress";

  function loadCourseProgress() {
    try { return JSON.parse(localStorage.getItem(COURSE_PROGRESS_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function saveCourseProgress(levelId, unitIdx, score) {
    const prog = loadCourseProgress();
    const key = `${levelId}-${unitIdx}`;
    const prev = prog[key] || 0;
    if (score > prev) prog[key] = score;
    localStorage.setItem(COURSE_PROGRESS_KEY, JSON.stringify(prog));
  }

  function getUnitScore(levelId, unitIdx) {
    return loadCourseProgress()[`${levelId}-${unitIdx}`] || 0;
  }

  function getLevelAvg(level) {
    const prog = loadCourseProgress();
    let total = 0, done = 0;
    level.units.forEach((_, i) => {
      const s = prog[`${level.id}-${i}`] || 0;
      total += s;
      if (s > 0) done++;
    });
    return { done, total: level.units.length, avg: done > 0 ? total / done : 0 };
  }

  // Build level list
  function buildCourseLevels() {
    const grid = document.getElementById("course-level-grid");
    grid.innerHTML = "";
    COURSE_LEVELS.forEach((level) => {
      const stats = getLevelAvg(level);
      const pct = Math.round(stats.done / stats.total * 100);
      const btn = document.createElement("button");
      btn.className = "level-card";
      btn.innerHTML = `
        <span class="level-num" style="background:${level.color}">${level.id}</span>
        <span class="level-icon">${level.icon}</span>
        <div class="level-info">
          <span class="level-name">${level.name}</span>
          <span class="level-desc">${level.desc}</span>
          <div class="level-progress"><div class="level-progress-fill" style="width:${pct}%"></div></div>
        </div>
        <span class="level-stars">${stats.done}/${stats.total}</span>
      `;
      btn.addEventListener("click", () => buildCourseUnits(level));
      grid.appendChild(btn);
    });
  }

  // Build unit list for a level
  let cpLevel = null;

  function buildCourseUnits(level) {
    cpLevel = level;
    document.getElementById("course-level-title").textContent = `${level.icon} Level ${level.id}: ${level.name}`;
    document.getElementById("course-level-desc").textContent = level.desc;
    const grid = document.getElementById("course-unit-grid");
    grid.innerHTML = "";
    level.units.forEach((unit, i) => {
      const score = getUnitScore(level.id, i);
      const typeBadges = { phonics: "发音", contrast: "对比", vocab: "词汇", sentence: "句子" };
      const btn = document.createElement("button");
      btn.className = "unit-card";
      btn.innerHTML = `
        <span class="unit-num" style="background:${level.color}">${i + 1}</span>
        <span class="unit-title">${unit.title}<span class="unit-type-badge">${typeBadges[unit.type] || unit.type}</span></span>
        <span class="unit-check">${score >= 2.5 ? "⭐" : score > 0 ? "🔶" : "○"}</span>
      `;
      btn.addEventListener("click", () => cpStartUnit(level, i));
      grid.appendChild(btn);
    });
    showScreen("course-units");
  }

  // Course Practice state
  let cpUnit = null, cpUnitIdx = 0, cpFlatItems = [], cpIdx = 0, cpScores = [];
  let cpContrastPhase = "short";   // "short" → "long" → done
  let cpContrastScore1 = 0;

  // Centralized DOM bundle for Course Practice module
  const cpDom = {
    card: $("cp-card"),
    contrast: $("cp-contrast-card"),
    emoji: $("cp-emoji"),
    prompt: $("cp-prompt"),
    cn: $("cp-cn"),
    soundRule: $("cp-sound-rule"),
    play: $("cp-play"),
    recBtn: $("cp-record"),
    recLabel: $("cp-record-label"),
    recInd: $("cp-rec-indicator"),
    feedback: $("cp-feedback"),
    fbStars: $("cp-fb-stars"),
    fbMsg: $("cp-fb-msg"),
    progressFill: $("cp-progress-fill"),
    counter: $("cp-counter"),
    aiHelp: $("cp-ai-help"),
    aiBtn: $("cp-ai-btn"),
    aiResult: $("cp-ai-result"),
    aiWords: $("cp-ai-words"),
    aiTip: $("cp-ai-tip"),
    aiLoading: $("cp-ai-loading"),
    retry: $("cp-retry"),
    next: $("cp-next"),
    shortPlay: $("cp-short-play"),
    longPlay: $("cp-long-play"),
  };

  // Flatten unit items into a sequential list for practice
  function flattenUnitItems(unit) {
    const items = [];
    if (unit.type === "phonics" || unit.type === "vocab") {
      unit.items.forEach(group => {
        if (group.words) {
          group.words.forEach(w => {
            items.push({
              type: "word",
              word: w.word, emoji: w.emoji, cn: w.cn,
              letter: group.letter || "", sound: group.sound || "",
            });
          });
        } else {
          items.push({
            type: "word",
            word: group.word, emoji: group.emoji, cn: group.cn,
            letter: "", sound: "",
          });
        }
      });
    } else if (unit.type === "contrast") {
      unit.items.forEach(pair => {
        items.push({ type: "contrast", short: pair.short, long: pair.long });
      });
    } else if (unit.type === "sentence") {
      unit.items.forEach(s => {
        items.push({ type: "sentence", en: s.en, cn: s.cn });
      });
    }
    return items;
  }

  function cpStartUnit(level, unitIdx) {
    cpLevel = level;
    cpUnitIdx = unitIdx;
    cpUnit = level.units[unitIdx];
    cpFlatItems = flattenUnitItems(cpUnit);
    cpIdx = 0;
    cpScores = [];
    cpContrastPhase = "short";
    showScreen("course-practice");
    cpShowItem();
  }

  function cpShowItem() {
    const item = cpFlatItems[cpIdx];
    prepareNextItemUI(cpDom);
    cpDom.progressFill.style.width = (cpIdx / cpFlatItems.length * 100) + "%";
    cpDom.counter.textContent = `${cpIdx + 1}/${cpFlatItems.length}`;

    if (item.type === "contrast") {
      cpContrastPhase = "short";
      cpDom.card.style.display = "none";
      cpDom.contrast.style.display = "block";
      $("cp-short-emoji").textContent = item.short.emoji;
      $("cp-short-word").textContent = item.short.word;
      $("cp-short-sound").textContent = item.short.sound;
      $("cp-long-emoji").textContent = item.long.emoji;
      $("cp-long-word").textContent = item.long.word;
      $("cp-long-sound").textContent = item.long.sound;
      cpDom.recLabel.textContent = "读左边的词";
      setTimeout(() => speak(item.short.word, 0.65), 300);
    } else if (item.type === "sentence") {
      cpDom.contrast.style.display = "none";
      cpDom.card.style.display = "flex";
      cpDom.emoji.textContent = "💬";
      cpDom.prompt.innerHTML = `<span style="font-size:1.1rem">${escapeHtml(item.cn)}</span><br><span style="color:var(--primary);font-weight:700;font-size:1.3rem">${escapeHtml(item.en)}</span>`;
      cpDom.cn.textContent = "";
      cpDom.soundRule.style.display = "none";
      cpDom.recLabel.textContent = "跟读";
      setTimeout(() => speak(item.en, 0.7), 300);
    } else {
      cpDom.contrast.style.display = "none";
      cpDom.card.style.display = "flex";
      cpDom.emoji.textContent = item.emoji;
      cpDom.prompt.textContent = item.word;
      cpDom.cn.textContent = item.cn;
      if (item.sound) {
        cpDom.soundRule.textContent = `${item.letter} = ${item.sound}`;
        cpDom.soundRule.style.display = "inline-block";
      } else {
        cpDom.soundRule.style.display = "none";
      }
      cpDom.recLabel.textContent = "说一说";
      setTimeout(() => speak(item.word, 0.7), 300);
    }
  }

  function cpDoRecord() {
    unlockIOSAudio();
    const item = cpFlatItems[cpIdx];
    let target;
    if (item.type === "contrast") {
      target = cpContrastPhase === "short" ? item.short.word : item.long.word;
    } else if (item.type === "sentence") {
      target = item.en;
    } else {
      target = item.word;
    }
    doRecognition(
      (results) => {
        if (item.type === "contrast" && cpContrastPhase === "short") {
          cpContrastScore1 = calcScore(results, target);
          cpContrastPhase = "long";
          cpDom.recLabel.textContent = "读右边的词";
          cpDom.recBtn.style.display = "flex";
          speak(item.long.word, 0.65);
        } else if (item.type === "contrast" && cpContrastPhase === "long") {
          const s2 = calcScore(results, target);
          const avg = Math.round((cpContrastScore1 + s2) / 2);
          cpShowFeedback(Math.max(1, avg));
        } else {
          cpShowFeedback(calcScore(results, target));
        }
      },
      () => cpManualFallback(),
      cpDom.recBtn, cpDom.recInd,
      handleMicDenied
    );
  }

  function cpManualFallback() {
    manualFallbackUI(cpDom, (s) => cpShowFeedback(s));
    cpDom.fbAnswer.style.display = "none";
  }

  function cpShowFeedback(score) {
    const item = cpFlatItems[cpIdx];
    cpScores[cpIdx] = score;

    // Add to mistake book
    if (score < 3) {
      if (item.type === "word") {
        addMistake("abc", { letter: item.letter, word: item.word, emoji: item.emoji });
      } else if (item.type === "sentence") {
        addMistake("dialogue", { en: item.en, cn: item.cn, scene: "course" });
      }
    } else {
      if (item.type === "word") removeMistake("abc", item.word);
      else if (item.type === "sentence") removeMistake("dialogue", item.en);
    }

    showFeedbackUI(cpDom, score);

    // Show AI help button when score is low and only for word items
    if (score <= 1 && item.type === "word" && typeof callGLM === "function") {
      cpDom.aiHelp.style.display = "flex";
      cpDom.aiBtn.style.display = "inline-block";
      cpDom.aiBtn.disabled = false;
      cpDom.aiResult.style.display = "none";
      cpDom.aiLoading.style.display = "none";
    } else {
      cpDom.aiHelp.style.display = "none";
    }
  }

  // AI Helper - call GLM for similar words
  cpDom.aiBtn.addEventListener("click", async () => {
    const item = cpFlatItems[cpIdx];
    if (!item || item.type !== "word") return;

    cpDom.aiBtn.disabled = true;
    cpDom.aiLoading.style.display = "block";
    cpDom.aiResult.style.display = "none";

    const [similarWords, phonicsTip] = await Promise.all([
      glmSimilarWords(item.word),
      item.letter ? glmPhonicsHelp(item.letter, item.word) : Promise.resolve(null),
    ]);

    cpDom.aiLoading.style.display = "none";

    if (similarWords) {
      cpDom.aiResult.style.display = "block";
      cpDom.aiBtn.style.display = "none";
      cpDom.aiWords.innerHTML = "";
      similarWords.forEach(w => {
        const tag = document.createElement("div");
        tag.className = "ai-word-tag";
        // Use textContent (not innerHTML) for AI-generated content — XSS defense
        tag.innerHTML = `<span class="ai-word-emoji"></span><span class="ai-word-en"></span><span class="ai-word-cn"></span>`;
        tag.querySelector(".ai-word-emoji").textContent = w.emoji || "📝";
        tag.querySelector(".ai-word-en").textContent = w.word || "";
        tag.querySelector(".ai-word-cn").textContent = w.cn || "";
        tag.addEventListener("click", () => { unlockIOSAudio(); speak(w.word, 0.7); });
        cpDom.aiWords.appendChild(tag);
      });
      if (phonicsTip) {
        cpDom.aiTip.textContent = phonicsTip;
        cpDom.aiTip.style.display = "block";
      } else {
        cpDom.aiTip.style.display = "none";
      }
    } else {
      cpDom.aiBtn.disabled = false;
      cpDom.fbMsg.textContent += " (AI 暂时不可用)";
      showToast("🤖 AI 暂时不可用，请稍后再试", "error");
    }
  });

  function cpNext() {
    cpIdx++;
    if (cpIdx >= cpFlatItems.length) cpResults();
    else cpShowItem();
  }

  function cpResults() {
    showScreen("result");
    const $t = document.getElementById("result-title");
    const $s = document.getElementById("result-summary");
    const $b = document.getElementById("result-buttons");

    let total = 0;
    $s.innerHTML = "";
    cpFlatItems.forEach((item, i) => {
      const sc = cpScores[i] || 1;
      total += sc;
      let label, emoji;
      if (item.type === "contrast") {
        label = `${item.short.word} vs ${item.long.word}`;
        emoji = "🔀";
      } else if (item.type === "sentence") {
        label = item.en;
        emoji = "💬";
      } else {
        label = `${item.word} (${item.cn})`;
        emoji = item.emoji;
      }
      $s.innerHTML += `<div class="result-item${sc<3?" needs-practice":""}">
        <div class="word-info"><span class="emoji">${emoji}</span><span>${label}</span></div>
        <span class="stars">${"⭐".repeat(sc)}</span></div>`;
    });

    const avg = total / cpFlatItems.length;
    saveCourseProgress(cpLevel.id, cpUnitIdx, avg);

    if (avg >= 2.8) { $t.textContent = "🎉 太厉害了！全部满分！"; celebrate(); }
    else if (avg >= 2) { $t.textContent = "👍 不错！继续加油！"; }
    else { $t.textContent = "💪 多练习就会更好！"; }

    $b.innerHTML = "";

    const weak = cpFlatItems.filter((_, i) => (cpScores[i] || 1) < 3);
    if (weak.length > 0) {
      const rb = document.createElement("button");
      rb.className = "btn-primary";
      rb.textContent = "🔄 重新练习不熟的内容";
      rb.addEventListener("click", () => {
        cpFlatItems = weak; cpIdx = 0; cpScores = [];
        cpContrastPhase = "short";
        showScreen("course-practice"); cpShowItem();
      });
      $b.appendChild(rb);
    }

    // Next unit
    const nextIdx = cpUnitIdx + 1;
    if (nextIdx < cpLevel.units.length) {
      const nb = document.createElement("button");
      nb.className = weak.length > 0 ? "btn-secondary" : "btn-primary";
      nb.textContent = `下一单元：${cpLevel.units[nextIdx].title} →`;
      nb.addEventListener("click", () => cpStartUnit(cpLevel, nextIdx));
      $b.appendChild(nb);
    }

    const ub = document.createElement("button");
    ub.className = "btn-secondary";
    ub.textContent = `📋 返回 Level ${cpLevel.id}`;
    ub.addEventListener("click", () => buildCourseUnits(cpLevel));
    $b.appendChild(ub);

    const hb = document.createElement("button");
    hb.className = "btn-secondary";
    hb.textContent = "🏠 回到主菜单";
    hb.addEventListener("click", () => showScreen("menu"));
    $b.appendChild(hb);
  }

  // Play buttons for contrast cards
  cpDom.shortPlay.addEventListener("click", () => {
    unlockIOSAudio();
    const item = cpFlatItems[cpIdx];
    if (item && item.type === "contrast") speak(item.short.word, 0.65);
  });
  cpDom.longPlay.addEventListener("click", () => {
    unlockIOSAudio();
    const item = cpFlatItems[cpIdx];
    if (item && item.type === "contrast") speak(item.long.word, 0.65);
  });

  cpDom.play.addEventListener("click", () => {
    unlockIOSAudio();
    const item = cpFlatItems[cpIdx];
    if (!item) return;
    if (item.type === "sentence") speak(item.en, 0.7);
    else speak(item.word, 0.7);
  });

  cpDom.recBtn.addEventListener("click", () => cpDoRecord());

  cpDom.retry.addEventListener("click", () => {
    cpDom.feedback.style.display = "none";
    cpDom.recBtn.style.display = "flex";
    const item = cpFlatItems[cpIdx];
    if (item.type === "contrast") {
      cpContrastPhase = "short";
      cpDom.recLabel.textContent = "读左边的词";
      speak(item.short.word, 0.65);
    } else if (item.type === "sentence") {
      speak(item.en, 0.7);
    } else {
      speak(item.word, 0.7);
    }
  });

  cpDom.next.addEventListener("click", () => cpNext());

  $("cp-back").addEventListener("click", () => {
    window.speechSynthesis.cancel();
    if (cpLevel) buildCourseUnits(cpLevel);
    else showScreen("course");
  });

  // ═══════════════════════════════════
  //  Global init
  // ═══════════════════════════════════

  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  updateMistakeBadge();

  // Show a one-time banner if speech recognition is not supported in this browser
  if (!hasSpeechRecognition) {
    setTimeout(() => {
      showToast("ℹ️ 当前浏览器不支持语音识别，将使用家长打分模式", "info", 5000);
    }, 800);
  }

  // Deep-link support: ?module=course|mistakes|abc opens that module directly
  // (used by PWA manifest shortcuts for quick access)
  (function handleDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const mod = params.get("module");
    if (!mod) return;
    const card = document.querySelector(`.menu-card[data-module="${mod}"]`);
    if (card) {
      // Defer until after init so screen management is ready
      setTimeout(() => card.click(), 100);
    }
  })();

  document.addEventListener("touchend", (e) => {
    if (e.target.closest("button")) {
      e.preventDefault();
      e.target.closest("button").click();
    }
  }, { passive: false });
})();
