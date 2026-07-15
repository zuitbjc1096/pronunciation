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

  // ── Generic speech recognition helper ──
  // onResult(transcript, confidence) => called when speech is recognized
  // onFallback() => called when recognition fails or unavailable
  function doRecognition(onResult, onFallback, $recBtn, $recIndicator) {
    if (!hasSpeechRecognition) { onFallback(); return; }

    let rec, recording = true;
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

    rec.onerror = (e) => {
      recording = false;
      if ($recIndicator) $recIndicator.style.display = "none";
      if ($recBtn) $recBtn.style.display = "flex";
      if (e.error === "not-allowed" || e.error === "service-not-allowed") onFallback();
      else onFallback();
    };

    rec.onend = () => {
      if (recording) {
        recording = false;
        if ($recIndicator) $recIndicator.style.display = "none";
        if ($recBtn) $recBtn.style.display = "flex";
      }
    };

    try { rec.start(); } catch (e) { onFallback(); return; }
    setTimeout(() => { if (recording) { try { rec.stop(); } catch(e){} } }, 5000);
  }

  // ── Render manual score buttons into a container ──
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

  // ── Score display helper ──
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

  // ── Score from recognition results ──
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

  // ═══════════════════════════════════
  //  Screen management
  // ═══════════════════════════════════

  const allScreens = {};
  document.querySelectorAll(".screen").forEach(s => { allScreens[s.id.replace("screen-", "")] = s; });

  function showScreen(name) {
    Object.values(allScreens).forEach(s => s.classList.remove("active"));
    allScreens[name].classList.add("active");
    window.scrollTo(0, 0);
  }

  // Back buttons
  document.querySelectorAll(".btn-back[data-go]").forEach(btn => {
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
      if (mod === "abc") { buildLetterGrid(); showScreen("abc"); }
      else if (mod === "quiz") { buildQuizCategories(); showScreen("quiz-menu"); }
      else if (mod === "dialogue") { buildDialogueScenes(); showScreen("dialogue-menu"); }
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
      (results) => {
        const score = calcScore(results, target);
        abcFinish(score);
      },
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
    hb.addEventListener("click", () => {
      const d = LETTER_DATA[abcLetter];
      if (d._orig) { d.words = d._orig; delete d._orig; }
      showScreen("menu");
    });
    $b.appendChild(hb);
  }

  // ABC event listeners
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

  // ABC back button override
  document.querySelector('#screen-practice .btn-back').addEventListener("click", () => {
    window.speechSynthesis.cancel();
    const d = LETTER_DATA[abcLetter];
    if (d._orig) { d.words = d._orig; delete d._orig; }
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
      (results) => {
        const score = calcScore(results, item.en);
        quizShowFeedback(score);
      },
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
    if (avg >= 2.8) {
      $t.textContent = "🎉 太厉害了！全都认识！";
      celebrate();
    } else if (avg >= 2) {
      $t.textContent = "👍 不错！继续加油！";
    } else {
      $t.textContent = "💪 多练习就会更好！";
    }

    $b.innerHTML = "";
    const weak = quizItems.filter((_, i) => (quizScores[i] || 1) < 3);
    if (weak.length > 0) {
      const rb = document.createElement("button");
      rb.className = "btn-primary";
      rb.textContent = "🔄 重新练习不熟的词";
      rb.addEventListener("click", () => {
        quizItems = weak;
        quizIdx = 0;
        quizScores = [];
        showScreen("quiz");
        quizShowItem();
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

  // Quiz event listeners
  $quizRecBtn.addEventListener("click", () => quizDoRecord());
  $quizPlayHint.addEventListener("click", () => {
    unlockIOSAudio();
    speak(quizItems[quizIdx].en, 0.7);
  });
  document.getElementById("quiz-retry").addEventListener("click", () => {
    $quizFeedback.style.display = "none";
    $quizRecBtn.style.display = "flex";
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
      (results) => {
        const score = calcScore(results, item.en);
        dlgShowFeedback(score);
      },
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
    dlgScores[dlgIdx] = score;
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
    if (avg >= 2.8) {
      $t.textContent = "🎉 发音超棒！全部满分！";
      celebrate();
    } else if (avg >= 2) {
      $t.textContent = "👍 说得不错！继续加油！";
    } else {
      $t.textContent = "💪 多听多读就会更好！";
    }

    $b.innerHTML = "";
    const weak = dlgItems.filter((_, i) => (dlgScores[i] || 1) < 3);
    if (weak.length > 0) {
      const rb = document.createElement("button");
      rb.className = "btn-primary";
      rb.textContent = "🔄 重新练习不熟的句子";
      rb.addEventListener("click", () => {
        dlgItems = weak;
        dlgIdx = 0;
        dlgScores = [];
        showScreen("dialogue");
        dlgShowItem();
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

  // Dialogue event listeners
  $dlgPlay.addEventListener("click", () => {
    unlockIOSAudio();
    speak(dlgItems[dlgIdx].en, 0.7);
  });
  $dlgRecBtn.addEventListener("click", () => dlgDoRecord());
  document.getElementById("dlg-retry").addEventListener("click", () => {
    $dlgFeedback.style.display = "none";
    $dlgRecBtn.style.display = "flex";
    speak(dlgItems[dlgIdx].en, 0.7);
  });
  document.getElementById("dlg-next").addEventListener("click", () => dlgNext());

  // ═══════════════════════════════════
  //  Global init
  // ═══════════════════════════════════

  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  document.addEventListener("touchend", (e) => {
    if (e.target.closest("button")) {
      e.preventDefault();
      e.target.closest("button").click();
    }
  }, { passive: false });
})();
