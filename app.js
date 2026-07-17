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
  function doRecognition(onResult, onFallback, $recBtn, $recIndicator) {
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

    rec.onerror = () => {
      recording = false;
      if ($recIndicator) $recIndicator.style.display = "none";
      if ($recBtn) $recBtn.style.display = "flex";
      onFallback();
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

  function abcCleanup() {
    const d = LETTER_DATA[abcLetter];
    if (d && d._orig) { d.words = d._orig; delete d._orig; }
  }

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
    abcCleanup();
    abcLetter = letter;
    abcWordIdx = 0;
    abcScores = {};
    showScreen("practice");
    $stepLetter.style.display = "flex";
    $stepWord.style.display = "none";
    $bigLetter.textContent = letter;
    abcUpdateProgress();
    setTimeout(() => speak(LETTER_DATA[letter].sound, 0.75), 200);
  }

  function abcUpdateProgress() {
    const total = LETTER_DATA[abcLetter].words.length;
    $progressFill.style.width = (abcWordIdx / total * 100) + "%";
  }

  function abcShowWord() {
    const w = LETTER_DATA[abcLetter].words[abcWordIdx];
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
    const target = LETTER_DATA[abcLetter].words[abcWordIdx].word;
    doRecognition(
      (results) => abcFinish(calcScore(results, target)),
      () => abcManualScore(),
      $btnRecord, $recIndicator
    );
  }

  function abcManualScore() {
    $btnRecord.style.display = "none";
    $recIndicator.style.display = "none";
    $scoreDisplay.style.display = "flex";
    document.getElementById("btn-retry-word").style.display = "none";
    document.getElementById("btn-next-word").style.display = "none";
    $scoreMessage.textContent = "家长请打分：";
    $scoreMessage.className = "score-message";
    renderManualScore($scoreStars, (s) => abcFinish(s));
  }

  function abcFinish(score) {
    const w = LETTER_DATA[abcLetter].words[abcWordIdx];
    abcScores[w.word] = score;

    if (score < 3) {
      addMistake("abc", { letter: abcLetter, word: w.word, emoji: w.emoji });
    } else {
      removeMistake("abc", w.word);
    }

    $btnRecord.style.display = "none";
    $scoreDisplay.style.display = "flex";
    document.getElementById("btn-retry-word").style.display = "inline-block";
    document.getElementById("btn-next-word").style.display = "inline-block";
    showScoreUI($scoreStars, $scoreMessage, score);
  }

  function abcNext() {
    abcWordIdx++;
    if (abcWordIdx >= LETTER_DATA[abcLetter].words.length) abcResults();
    else abcShowWord();
  }

  function abcResults() {
    showScreen("result");
    const data = LETTER_DATA[abcLetter];
    const weak = [];
    let allPerfect = true;
    const $t = document.getElementById("result-title");
    const $s = document.getElementById("result-summary");
    const $b = document.getElementById("result-buttons");
    $s.innerHTML = "";
    data.words.forEach(w => {
      const sc = abcScores[w.word] || 1;
      if (sc < 3) { weak.push(w); allPerfect = false; }
      $s.innerHTML += `<div class="result-item${sc<3?" needs-practice":""}">
        <div class="word-info"><span class="emoji">${w.emoji}</span><span>${w.word}</span></div>
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
        const d = LETTER_DATA[abcLetter];
        d._orig = d._orig || [...d.words];
        d.words = weak;
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
    hb.addEventListener("click", () => { abcCleanup(); showScreen("menu"); });
    $b.appendChild(hb);
  }

  document.getElementById("btn-play-letter").addEventListener("click", () => {
    unlockIOSAudio();
    speak(LETTER_DATA[abcLetter].sound, 0.75);
  });
  document.getElementById("btn-next-to-word").addEventListener("click", () => abcShowWord());
  document.getElementById("btn-play-word").addEventListener("click", () => {
    unlockIOSAudio();
    speak(LETTER_DATA[abcLetter].words[abcWordIdx].word, 0.75);
  });
  $btnRecord.addEventListener("click", () => abcDoRecord());
  document.getElementById("btn-retry-word").addEventListener("click", () => {
    $scoreDisplay.style.display = "none";
    $btnRecord.style.display = "flex";
    speak(LETTER_DATA[abcLetter].words[abcWordIdx].word, 0.75);
  });
  document.getElementById("btn-next-word").addEventListener("click", () => abcNext());

  // FIX: Single dedicated back handler for practice screen (no double binding)
  document.querySelector("#screen-practice .btn-back").addEventListener("click", () => {
    window.speechSynthesis.cancel();
    abcCleanup();
    buildLetterGrid();
    showScreen("abc");
  });

  // ═══════════════════════════════════
  //  MODULE 2: Quiz (看图说英语)
  // ═══════════════════════════════════

  let quizCategory = null, quizItems = [], quizIdx = 0, quizScores = [];
  const QUIZ_PER_ROUND = 5;

  const $quizEmoji = document.getElementById("quiz-emoji");
  const $quizPrompt = document.getElementById("quiz-prompt");
  const $quizPlayHint = document.getElementById("quiz-play-hint");
  const $quizRecBtn = document.getElementById("quiz-record");
  const $quizRecInd = document.getElementById("quiz-rec-indicator");
  const $quizFeedback = document.getElementById("quiz-feedback");
  const $quizFbStars = document.getElementById("quiz-fb-stars");
  const $quizFbMsg = document.getElementById("quiz-fb-msg");
  const $quizFbAnswer = document.getElementById("quiz-fb-answer");
  const $quizProgressFill = document.getElementById("quiz-progress-fill");
  const $quizCounter = document.getElementById("quiz-counter");

  function buildQuizCategories() {
    const grid = document.getElementById("quiz-category-grid");
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
    $quizEmoji.textContent = item.emoji;
    $quizPrompt.innerHTML = `这是什么？<br><span style="font-size:1rem;color:#999">用英语说出它的名字</span>`;
    $quizPlayHint.style.display = "none";
    $quizRecBtn.style.display = "flex";
    $quizRecInd.style.display = "none";
    $quizFeedback.style.display = "none";
    $quizProgressFill.style.width = (quizIdx / quizItems.length * 100) + "%";
    $quizCounter.textContent = `${quizIdx + 1}/${quizItems.length}`;
  }

  function quizDoRecord() {
    unlockIOSAudio();
    const item = quizItems[quizIdx];
    doRecognition(
      (results) => quizShowFeedback(calcScore(results, item.en)),
      () => quizManualFallback(),
      $quizRecBtn, $quizRecInd
    );
  }

  function quizManualFallback() {
    $quizRecBtn.style.display = "none";
    $quizRecInd.style.display = "none";
    $quizFeedback.style.display = "flex";
    $quizFbMsg.textContent = "家长请打分：";
    $quizFbMsg.className = "score-message";
    $quizFbAnswer.style.display = "none";
    document.getElementById("quiz-retry").style.display = "none";
    document.getElementById("quiz-next").style.display = "none";
    renderManualScore($quizFbStars, (s) => quizShowFeedback(s));
  }

  function quizShowFeedback(score) {
    const item = quizItems[quizIdx];
    quizScores[quizIdx] = score;

    if (score < 3) {
      addMistake("quiz", { en: item.en, cn: item.cn, emoji: item.emoji, category: quizCategory.id });
    } else {
      removeMistake("quiz", item.en);
    }

    $quizRecBtn.style.display = "none";
    $quizFeedback.style.display = "flex";
    document.getElementById("quiz-retry").style.display = "inline-block";
    document.getElementById("quiz-next").style.display = "inline-block";
    showScoreUI($quizFbStars, $quizFbMsg, score);

    if (score < 3) {
      $quizFbAnswer.style.display = "block";
      $quizFbAnswer.innerHTML = `正确答案：<strong>${item.en}</strong>（${item.cn}）`;
      $quizPlayHint.style.display = "inline-block";
      speak(item.en, 0.7);
    } else {
      $quizFbAnswer.style.display = "none";
      $quizPlayHint.style.display = "none";
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

  $quizRecBtn.addEventListener("click", () => quizDoRecord());
  $quizPlayHint.addEventListener("click", () => { unlockIOSAudio(); speak(quizItems[quizIdx].en, 0.7); });
  document.getElementById("quiz-retry").addEventListener("click", () => {
    $quizFeedback.style.display = "none"; $quizRecBtn.style.display = "flex";
  });
  document.getElementById("quiz-next").addEventListener("click", () => quizNext());

  // ═══════════════════════════════════
  //  MODULE 3: Dialogue (日常对话跟读)
  // ═══════════════════════════════════

  let dlgScene = null, dlgItems = [], dlgIdx = 0, dlgScores = [];

  const $dlgCn = document.getElementById("dlg-cn-text");
  const $dlgEn = document.getElementById("dlg-en-text");
  const $dlgPlay = document.getElementById("dlg-play");
  const $dlgRecBtn = document.getElementById("dlg-record");
  const $dlgRecInd = document.getElementById("dlg-rec-indicator");
  const $dlgFeedback = document.getElementById("dlg-feedback");
  const $dlgFbStars = document.getElementById("dlg-fb-stars");
  const $dlgFbMsg = document.getElementById("dlg-fb-msg");
  const $dlgProgressFill = document.getElementById("dlg-progress-fill");
  const $dlgCounter = document.getElementById("dlg-counter");

  function buildDialogueScenes() {
    const grid = document.getElementById("dialogue-scene-grid");
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
    $dlgCn.textContent = item.cn;
    $dlgEn.textContent = item.en;
    $dlgRecBtn.style.display = "flex";
    $dlgRecInd.style.display = "none";
    $dlgFeedback.style.display = "none";
    $dlgProgressFill.style.width = (dlgIdx / dlgItems.length * 100) + "%";
    $dlgCounter.textContent = `${dlgIdx + 1}/${dlgItems.length}`;
    setTimeout(() => speak(item.en, 0.7), 300);
  }

  function dlgDoRecord() {
    unlockIOSAudio();
    const item = dlgItems[dlgIdx];
    doRecognition(
      (results) => dlgShowFeedback(calcScore(results, item.en)),
      () => dlgManualFallback(),
      $dlgRecBtn, $dlgRecInd
    );
  }

  function dlgManualFallback() {
    $dlgRecBtn.style.display = "none";
    $dlgRecInd.style.display = "none";
    $dlgFeedback.style.display = "flex";
    $dlgFbMsg.textContent = "家长请打分：";
    $dlgFbMsg.className = "score-message";
    document.getElementById("dlg-retry").style.display = "none";
    document.getElementById("dlg-next").style.display = "none";
    renderManualScore($dlgFbStars, (s) => dlgShowFeedback(s));
  }

  function dlgShowFeedback(score) {
    const item = dlgItems[dlgIdx];
    dlgScores[dlgIdx] = score;

    if (score < 3) {
      addMistake("dialogue", { en: item.en, cn: item.cn, scene: dlgScene.id });
    } else {
      removeMistake("dialogue", item.en);
    }

    $dlgRecBtn.style.display = "none";
    $dlgFeedback.style.display = "flex";
    document.getElementById("dlg-retry").style.display = "inline-block";
    document.getElementById("dlg-next").style.display = "inline-block";
    showScoreUI($dlgFbStars, $dlgFbMsg, score);
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

  $dlgPlay.addEventListener("click", () => { unlockIOSAudio(); speak(dlgItems[dlgIdx].en, 0.7); });
  $dlgRecBtn.addEventListener("click", () => dlgDoRecord());
  document.getElementById("dlg-retry").addEventListener("click", () => {
    $dlgFeedback.style.display = "none"; $dlgRecBtn.style.display = "flex";
    speak(dlgItems[dlgIdx].en, 0.7);
  });
  document.getElementById("dlg-next").addEventListener("click", () => dlgNext());

  // ═══════════════════════════════════
  //  MODULE 4: Mistake Book (错题集页面)
  // ═══════════════════════════════════

  let mpType = null, mpItems = [], mpIdx = 0, mpScores = [];

  const $mpEmoji = document.getElementById("mp-emoji");
  const $mpPrompt = document.getElementById("mp-prompt");
  const $mpPlay = document.getElementById("mp-play");
  const $mpRecBtn = document.getElementById("mp-record");
  const $mpRecInd = document.getElementById("mp-rec-indicator");
  const $mpFeedback = document.getElementById("mp-feedback");
  const $mpFbStars = document.getElementById("mp-fb-stars");
  const $mpFbMsg = document.getElementById("mp-fb-msg");
  const $mpFbAnswer = document.getElementById("mp-fb-answer");
  const $mpProgressFill = document.getElementById("mp-progress-fill");
  const $mpCounter = document.getElementById("mp-counter");

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
    $mpRecBtn.style.display = "flex";
    $mpRecInd.style.display = "none";
    $mpFeedback.style.display = "none";
    $mpFbAnswer.style.display = "none";
    $mpProgressFill.style.width = (mpIdx / mpItems.length * 100) + "%";
    $mpCounter.textContent = `${mpIdx + 1}/${mpItems.length}`;

    if (mpType === "abc") {
      $mpEmoji.textContent = item.emoji;
      $mpPrompt.innerHTML = `字母 <strong>${item.letter}</strong> 的单词`;
      $mpPlay.onclick = () => { unlockIOSAudio(); speak(item.word, 0.7); };
      setTimeout(() => speak(item.word, 0.7), 300);
    } else if (mpType === "quiz") {
      $mpEmoji.textContent = item.emoji;
      $mpPrompt.innerHTML = `这是什么？<br><span style="font-size:1rem;color:#999">${item.cn}</span>`;
      $mpPlay.onclick = () => { unlockIOSAudio(); speak(item.en, 0.7); };
    } else {
      $mpEmoji.textContent = "💬";
      $mpPrompt.innerHTML = `<span style="font-size:1.1rem">${item.cn}</span><br><span style="color:var(--primary);font-weight:700">${item.en}</span>`;
      $mpPlay.onclick = () => { unlockIOSAudio(); speak(item.en, 0.7); };
      setTimeout(() => speak(item.en, 0.7), 300);
    }
  }

  function mpDoRecord() {
    unlockIOSAudio();
    const item = mpItems[mpIdx];
    const target = mpType === "abc" ? item.word : item.en;
    doRecognition(
      (results) => mpShowFeedback(calcScore(results, target)),
      () => mpManualFallback(),
      $mpRecBtn, $mpRecInd
    );
  }

  function mpManualFallback() {
    $mpRecBtn.style.display = "none";
    $mpRecInd.style.display = "none";
    $mpFeedback.style.display = "flex";
    $mpFbMsg.textContent = "家长请打分：";
    $mpFbMsg.className = "score-message";
    $mpFbAnswer.style.display = "none";
    document.getElementById("mp-retry").style.display = "none";
    document.getElementById("mp-next").style.display = "none";
    renderManualScore($mpFbStars, (s) => mpShowFeedback(s));
  }

  function mpShowFeedback(score) {
    const item = mpItems[mpIdx];
    mpScores[mpIdx] = score;

    const key = mpType === "abc" ? item.word : item.en;
    if (score >= 3) {
      removeMistake(mpType, key);
    }

    $mpRecBtn.style.display = "none";
    $mpFeedback.style.display = "flex";
    document.getElementById("mp-retry").style.display = "inline-block";
    document.getElementById("mp-next").style.display = "inline-block";
    showScoreUI($mpFbStars, $mpFbMsg, score);

    if (score < 3) {
      const answer = mpType === "abc" ? item.word : item.en;
      const extra = mpType === "quiz" ? `（${item.cn}）` : "";
      $mpFbAnswer.style.display = "block";
      $mpFbAnswer.innerHTML = `正确答案：<strong>${answer}</strong>${extra}`;
      speak(answer, 0.7);
    } else {
      $mpFbAnswer.style.display = "none";
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

  $mpRecBtn.addEventListener("click", () => mpDoRecord());
  document.getElementById("mp-retry").addEventListener("click", () => {
    $mpFeedback.style.display = "none";
    $mpRecBtn.style.display = "flex";
    const item = mpItems[mpIdx];
    speak(mpType === "abc" ? item.word : item.en, 0.7);
  });
  document.getElementById("mp-next").addEventListener("click", () => mpNext());
  document.getElementById("mp-back").addEventListener("click", () => {
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

  const $cpCard = document.getElementById("cp-card");
  const $cpContrast = document.getElementById("cp-contrast-card");
  const $cpEmoji = document.getElementById("cp-emoji");
  const $cpPrompt = document.getElementById("cp-prompt");
  const $cpCn = document.getElementById("cp-cn");
  const $cpSoundRule = document.getElementById("cp-sound-rule");
  const $cpPlay = document.getElementById("cp-play");
  const $cpRecBtn = document.getElementById("cp-record");
  const $cpRecLabel = document.getElementById("cp-record-label");
  const $cpRecInd = document.getElementById("cp-rec-indicator");
  const $cpFeedback = document.getElementById("cp-feedback");
  const $cpFbStars = document.getElementById("cp-fb-stars");
  const $cpFbMsg = document.getElementById("cp-fb-msg");
  const $cpProgressFill = document.getElementById("cp-progress-fill");
  const $cpCounter = document.getElementById("cp-counter");
  const $cpAiHelp = document.getElementById("cp-ai-help");
  const $cpAiBtn = document.getElementById("cp-ai-btn");
  const $cpAiResult = document.getElementById("cp-ai-result");
  const $cpAiWords = document.getElementById("cp-ai-words");
  const $cpAiTip = document.getElementById("cp-ai-tip");
  const $cpAiLoading = document.getElementById("cp-ai-loading");

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
    showScreen("course-practice");
    cpShowItem();
  }

  function cpShowItem() {
    const item = cpFlatItems[cpIdx];
    $cpRecBtn.style.display = "flex";
    $cpRecInd.style.display = "none";
    $cpFeedback.style.display = "none";
    $cpAiHelp.style.display = "none";
    $cpProgressFill.style.width = (cpIdx / cpFlatItems.length * 100) + "%";
    $cpCounter.textContent = `${cpIdx + 1}/${cpFlatItems.length}`;

    if (item.type === "contrast") {
      $cpCard.style.display = "none";
      $cpContrast.style.display = "block";
      document.getElementById("cp-short-emoji").textContent = item.short.emoji;
      document.getElementById("cp-short-word").textContent = item.short.word;
      document.getElementById("cp-short-sound").textContent = item.short.sound;
      document.getElementById("cp-long-emoji").textContent = item.long.emoji;
      document.getElementById("cp-long-word").textContent = item.long.word;
      document.getElementById("cp-long-sound").textContent = item.long.sound;
      $cpRecLabel.textContent = "读左边的词";
      cpContrastPhase = "short";
      setTimeout(() => speak(item.short.word, 0.65), 300);
    } else if (item.type === "sentence") {
      $cpContrast.style.display = "none";
      $cpCard.style.display = "flex";
      $cpEmoji.textContent = "💬";
      $cpPrompt.innerHTML = `<span style="font-size:1.1rem">${item.cn}</span><br><span style="color:var(--primary);font-weight:700;font-size:1.3rem">${item.en}</span>`;
      $cpCn.textContent = "";
      $cpSoundRule.style.display = "none";
      $cpRecLabel.textContent = "跟读";
      setTimeout(() => speak(item.en, 0.7), 300);
    } else {
      $cpContrast.style.display = "none";
      $cpCard.style.display = "flex";
      $cpEmoji.textContent = item.emoji;
      $cpPrompt.textContent = item.word;
      $cpCn.textContent = item.cn;
      if (item.sound) {
        $cpSoundRule.textContent = `${item.letter} = ${item.sound}`;
        $cpSoundRule.style.display = "inline-block";
      } else {
        $cpSoundRule.style.display = "none";
      }
      $cpRecLabel.textContent = "说一说";
      setTimeout(() => speak(item.word, 0.7), 300);
    }
  }

  let cpContrastPhase = "short";

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
          const s1 = calcScore(results, target);
          cpContrastScore1 = s1;
          cpContrastPhase = "long";
          $cpRecLabel.textContent = "读右边的词";
          $cpRecBtn.style.display = "flex";
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
      $cpRecBtn, $cpRecInd
    );
  }

  let cpContrastScore1 = 0;

  function cpManualFallback() {
    $cpRecBtn.style.display = "none";
    $cpRecInd.style.display = "none";
    $cpFeedback.style.display = "flex";
    $cpFbMsg.textContent = "家长请打分：";
    $cpFbMsg.className = "score-message";
    $cpAiHelp.style.display = "none";
    document.getElementById("cp-retry").style.display = "none";
    document.getElementById("cp-next").style.display = "none";
    renderManualScore($cpFbStars, (s) => cpShowFeedback(s));
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

    $cpRecBtn.style.display = "none";
    $cpFeedback.style.display = "flex";
    document.getElementById("cp-retry").style.display = "inline-block";
    document.getElementById("cp-next").style.display = "inline-block";
    showScoreUI($cpFbStars, $cpFbMsg, score);

    // Show AI help button when score is low
    if (score <= 1 && item.type === "word" && typeof callGLM === "function") {
      $cpAiHelp.style.display = "flex";
      $cpAiBtn.style.display = "inline-block";
      $cpAiBtn.disabled = false;
      $cpAiResult.style.display = "none";
      $cpAiLoading.style.display = "none";
    } else {
      $cpAiHelp.style.display = "none";
    }
  }

  // AI Helper - call GLM for similar words
  $cpAiBtn.addEventListener("click", async () => {
    const item = cpFlatItems[cpIdx];
    if (!item || item.type !== "word") return;

    $cpAiBtn.disabled = true;
    $cpAiLoading.style.display = "block";
    $cpAiResult.style.display = "none";

    const [similarWords, phonicsTip] = await Promise.all([
      glmSimilarWords(item.word),
      item.letter ? glmPhonicsHelp(item.letter, item.word) : Promise.resolve(null),
    ]);

    $cpAiLoading.style.display = "none";

    if (similarWords) {
      $cpAiResult.style.display = "block";
      $cpAiBtn.style.display = "none";
      $cpAiWords.innerHTML = "";
      similarWords.forEach(w => {
        const tag = document.createElement("div");
        tag.className = "ai-word-tag";
        tag.innerHTML = `<span class="ai-word-emoji">${w.emoji || "📝"}</span><span class="ai-word-en">${w.word}</span><span class="ai-word-cn">${w.cn}</span>`;
        tag.addEventListener("click", () => { unlockIOSAudio(); speak(w.word, 0.7); });
        $cpAiWords.appendChild(tag);
      });
      if (phonicsTip) {
        $cpAiTip.textContent = phonicsTip;
        $cpAiTip.style.display = "block";
      } else {
        $cpAiTip.style.display = "none";
      }
    } else {
      $cpAiBtn.disabled = false;
      $cpFbMsg.textContent += " (AI 暂时不可用)";
    }
  });

  function cpNext() {
    cpIdx++;
    if (cpIdx >= cpFlatItems.length) cpResults();
    else {
      cpContrastPhase = "short";
      cpShowItem();
    }
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
  document.getElementById("cp-short-play").addEventListener("click", () => {
    unlockIOSAudio();
    const item = cpFlatItems[cpIdx];
    if (item && item.type === "contrast") speak(item.short.word, 0.65);
  });
  document.getElementById("cp-long-play").addEventListener("click", () => {
    unlockIOSAudio();
    const item = cpFlatItems[cpIdx];
    if (item && item.type === "contrast") speak(item.long.word, 0.65);
  });

  $cpPlay.addEventListener("click", () => {
    unlockIOSAudio();
    const item = cpFlatItems[cpIdx];
    if (!item) return;
    if (item.type === "sentence") speak(item.en, 0.7);
    else speak(item.word, 0.7);
  });

  $cpRecBtn.addEventListener("click", () => cpDoRecord());

  document.getElementById("cp-retry").addEventListener("click", () => {
    $cpFeedback.style.display = "none";
    $cpRecBtn.style.display = "flex";
    const item = cpFlatItems[cpIdx];
    if (item.type === "contrast") {
      cpContrastPhase = "short";
      $cpRecLabel.textContent = "读左边的词";
      speak(item.short.word, 0.65);
    } else if (item.type === "sentence") {
      speak(item.en, 0.7);
    } else {
      speak(item.word, 0.7);
    }
  });

  document.getElementById("cp-next").addEventListener("click", () => cpNext());

  document.getElementById("cp-back").addEventListener("click", () => {
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

  document.addEventListener("touchend", (e) => {
    if (e.target.closest("button")) {
      e.preventDefault();
      e.target.closest("button").click();
    }
  }, { passive: false });
})();
