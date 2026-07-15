(() => {
  // ── State ──
  let currentLetter = null;
  let currentWordIndex = 0;
  let scores = {};
  let recognition = null;
  let isRecording = false;
  const completedLetters = new Set(JSON.parse(localStorage.getItem("completedLetters") || "[]"));

  // ── DOM refs ──
  const $home     = document.getElementById("screen-home");
  const $practice = document.getElementById("screen-practice");
  const $result   = document.getElementById("screen-result");
  const $grid     = document.getElementById("letter-grid");

  const $stepLetter   = document.getElementById("step-letter");
  const $stepWord     = document.getElementById("step-word");
  const $bigLetter    = document.getElementById("current-letter");
  const $progressFill = document.getElementById("progress-fill");

  const $wordEmoji  = document.getElementById("word-emoji");
  const $wordText   = document.getElementById("word-text");
  const $btnRecord  = document.getElementById("btn-record");
  const $recordLabel= document.getElementById("record-label");
  const $recIndicator = document.getElementById("recording-indicator");
  const $scoreDisplay = document.getElementById("score-display");
  const $scoreStars   = document.getElementById("score-stars");
  const $scoreMessage = document.getElementById("score-message");

  // ── Speech API availability ──
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const hasSpeechRecognition = !!SpeechRecognition;

  // ── iOS detection ──
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // ── Init ──
  buildLetterGrid();
  if (!hasSpeechRecognition) {
    $recordLabel.textContent = "点击说话";
  }

  // ── Build letter grid ──
  function buildLetterGrid() {
    $grid.innerHTML = "";
    const letters = Object.keys(LETTER_DATA);
    letters.forEach((letter, i) => {
      const btn = document.createElement("button");
      btn.className = "letter-btn" + (completedLetters.has(letter) ? " completed" : "");
      btn.setAttribute("data-color", i % 10);
      btn.innerHTML = `
        <span class="letter-label">${letter}</span>
        <span class="letter-status"></span>
      `;
      btn.addEventListener("click", () => startPractice(letter));
      $grid.appendChild(btn);
    });
  }

  // ── Screen switching ──
  function showScreen(screen) {
    [$home, $practice, $result].forEach(s => s.classList.remove("active"));
    screen.classList.add("active");
    window.scrollTo(0, 0);
  }

  // ── TTS (with iOS workaround) ──
  let iosAudioUnlocked = false;

  function unlockIOSAudio() {
    if (iosAudioUnlocked || !isIOS) return;
    const utter = new SpeechSynthesisUtterance("");
    utter.volume = 0;
    window.speechSynthesis.speak(utter);
    iosAudioUnlocked = true;
  }

  function speak(text, rate = 0.85) {
    return new Promise(resolve => {
      window.speechSynthesis.cancel();

      // iOS requires a small delay after cancel
      const delay = isIOS ? 100 : 0;
      setTimeout(() => {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "en-US";
        utter.rate = rate;
        utter.pitch = 1.1;

        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.lang.startsWith("en") && v.name.includes("Samantha"))
                       || voices.find(v => v.lang.startsWith("en-US"))
                       || voices.find(v => v.lang.startsWith("en"));
        if (preferred) utter.voice = preferred;

        utter.onend = resolve;
        utter.onerror = resolve;
        window.speechSynthesis.speak(utter);

        // iOS workaround: speechSynthesis can pause in background
        if (isIOS) {
          const keepAlive = setInterval(() => {
            if (!window.speechSynthesis.speaking) {
              clearInterval(keepAlive);
              return;
            }
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }, 5000);
        }
      }, delay);
    });
  }

  // ── Start practice for a letter ──
  function startPractice(letter) {
    unlockIOSAudio();
    currentLetter = letter;
    currentWordIndex = 0;
    scores = {};

    showScreen($practice);
    $stepLetter.style.display = "flex";
    $stepWord.style.display = "none";

    $bigLetter.textContent = letter;
    updateProgress();

    setTimeout(() => speak(LETTER_DATA[letter].sound, 0.75), 200);
  }

  // ── Update progress bar ──
  function updateProgress() {
    const total = LETTER_DATA[currentLetter].words.length;
    const pct = (currentWordIndex / total) * 100;
    $progressFill.style.width = pct + "%";
  }

  // ── Show current word ──
  function showCurrentWord() {
    const data = LETTER_DATA[currentLetter];
    const wordObj = data.words[currentWordIndex];

    $stepLetter.style.display = "none";
    $stepWord.style.display = "flex";
    $scoreDisplay.style.display = "none";
    $recIndicator.style.display = "none";
    $btnRecord.style.display = "flex";

    $wordEmoji.textContent = wordObj.emoji;
    $wordText.textContent = wordObj.word;

    updateProgress();
    speak(wordObj.word, 0.75);
  }

  // ── Recording & Recognition ──
  function startRecording() {
    if (!hasSpeechRecognition) {
      showManualScoring();
      return;
    }

    try {
      recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 5;
      recognition.continuous = false;
    } catch (e) {
      showManualScoring();
      return;
    }

    isRecording = true;
    $btnRecord.classList.add("recording");
    $btnRecord.style.display = "none";
    $recIndicator.style.display = "block";

    recognition.onresult = (event) => {
      const wordObj = LETTER_DATA[currentLetter].words[currentWordIndex];
      const target = wordObj.word.toLowerCase().replace(/[^a-z]/g, "");

      let bestScore = 0;
      for (let i = 0; i < event.results[0].length; i++) {
        const heard = event.results[0][i].transcript.toLowerCase().replace(/[^a-z]/g, "");
        const confidence = event.results[0][i].confidence;
        const similarity = computeSimilarity(heard, target);
        const combinedScore = similarity * 0.7 + confidence * 0.3;
        if (combinedScore > bestScore) bestScore = combinedScore;
      }

      let score;
      if (bestScore >= 0.75) score = 3;
      else if (bestScore >= 0.45) score = 2;
      else score = 1;

      finishRecording(score);
    };

    recognition.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        showManualScoring();
      } else {
        finishRecording(null);
      }
    };

    recognition.onend = () => {
      if (isRecording) {
        isRecording = false;
        $recIndicator.style.display = "none";
        $btnRecord.classList.remove("recording");
        $btnRecord.style.display = "flex";
      }
    };

    try {
      recognition.start();
    } catch (e) {
      showManualScoring();
      return;
    }

    setTimeout(() => {
      if (isRecording && recognition) {
        try { recognition.stop(); } catch (e) { /* already stopped */ }
      }
    }, 5000);
  }

  function computeSimilarity(a, b) {
    if (a === b) return 1;
    if (!a.length || !b.length) return 0;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = b[i - 1] === a[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    const dist = matrix[b.length][a.length];
    return 1 - dist / Math.max(a.length, b.length);
  }

  function showManualScoring() {
    isRecording = false;
    $btnRecord.style.display = "none";
    $recIndicator.style.display = "none";
    $scoreDisplay.style.display = "flex";

    $scoreStars.innerHTML = `
      <button class="manual-score" data-score="1">⭐</button>
      <button class="manual-score" data-score="2">⭐⭐</button>
      <button class="manual-score" data-score="3">⭐⭐⭐</button>
    `;
    $scoreMessage.textContent = "家长请打分：";
    $scoreMessage.className = "score-message";

    document.getElementById("btn-retry-word").style.display = "none";
    document.getElementById("btn-next-word").style.display = "none";

    $scoreDisplay.querySelectorAll(".manual-score").forEach(btn => {
      btn.style.cssText = "background:none;border:2px solid #ddd;border-radius:16px;padding:12px 20px;font-size:1.3rem;cursor:pointer;transition:all 0.2s;min-height:48px;";
      btn.addEventListener("click", () => {
        const s = parseInt(btn.dataset.score);
        finishRecording(s);
      });
    });
  }

  function finishRecording(score) {
    isRecording = false;
    $recIndicator.style.display = "none";
    $btnRecord.classList.remove("recording");

    if (score === null) {
      showManualScoring();
      return;
    }

    const wordObj = LETTER_DATA[currentLetter].words[currentWordIndex];
    scores[wordObj.word] = score;

    $btnRecord.style.display = "none";
    $scoreDisplay.style.display = "flex";
    document.getElementById("btn-retry-word").style.display = "inline-block";
    document.getElementById("btn-next-word").style.display = "inline-block";

    if (score === 3) {
      $scoreStars.textContent = "⭐⭐⭐";
      $scoreMessage.textContent = "太棒了！Perfect!";
      $scoreMessage.className = "score-message perfect";
      celebrate();
    } else if (score === 2) {
      $scoreStars.textContent = "⭐⭐";
      $scoreMessage.textContent = "不错哦！Good job!";
      $scoreMessage.className = "score-message good";
    } else {
      $scoreStars.textContent = "⭐";
      $scoreMessage.textContent = "再加油！Try again!";
      $scoreMessage.className = "score-message try-again";
    }
  }

  // ── Go to next word or results ──
  function nextWord() {
    currentWordIndex++;
    const data = LETTER_DATA[currentLetter];
    if (currentWordIndex >= data.words.length) {
      showResults();
    } else {
      showCurrentWord();
    }
  }

  // ── Results screen ──
  function showResults() {
    showScreen($result);

    const data = LETTER_DATA[currentLetter];
    const needsPractice = [];
    let allPerfect = true;

    const $title = document.getElementById("result-title");
    const $summary = document.getElementById("result-summary");
    const $buttons = document.getElementById("result-buttons");

    $summary.innerHTML = "";
    data.words.forEach(w => {
      const score = scores[w.word] || 1;
      if (score < 3) {
        needsPractice.push(w);
        allPerfect = false;
      }
      const stars = "⭐".repeat(score);
      const needsClass = score < 3 ? " needs-practice" : "";
      $summary.innerHTML += `
        <div class="result-item${needsClass}">
          <div class="word-info">
            <span class="emoji">${w.emoji}</span>
            <span>${w.word}</span>
          </div>
          <span class="stars">${stars}</span>
        </div>
      `;
    });

    if (allPerfect) {
      $title.textContent = "🎉 全部满分！太厉害了！";
      completedLetters.add(currentLetter);
      localStorage.setItem("completedLetters", JSON.stringify([...completedLetters]));
      celebrate();
    } else {
      $title.textContent = `字母 ${currentLetter} 练习完成！`;
    }

    $buttons.innerHTML = "";

    if (needsPractice.length > 0) {
      const retryBtn = document.createElement("button");
      retryBtn.className = "btn-primary";
      retryBtn.textContent = "🔄 重新练习不熟的单词";
      retryBtn.addEventListener("click", () => retryWeakWords(needsPractice));
      $buttons.appendChild(retryBtn);
    }

    const letters = Object.keys(LETTER_DATA);
    const nextIndex = letters.indexOf(currentLetter) + 1;
    if (nextIndex < letters.length) {
      const nextBtn = document.createElement("button");
      nextBtn.className = needsPractice.length > 0 ? "btn-secondary" : "btn-primary";
      nextBtn.textContent = `下一个字母 ${letters[nextIndex]} →`;
      nextBtn.addEventListener("click", () => startPractice(letters[nextIndex]));
      $buttons.appendChild(nextBtn);
    }

    const homeBtn = document.createElement("button");
    homeBtn.className = "btn-secondary";
    homeBtn.textContent = "🏠 回到首页";
    homeBtn.addEventListener("click", () => {
      buildLetterGrid();
      showScreen($home);
    });
    $buttons.appendChild(homeBtn);
  }

  // ── Retry weak words ──
  function retryWeakWords(weakWords) {
    const data = LETTER_DATA[currentLetter];
    data._originalWords = data._originalWords || [...data.words];
    data.words = weakWords;
    currentWordIndex = 0;
    scores = {};

    showScreen($practice);
    $stepLetter.style.display = "none";
    $stepWord.style.display = "flex";
    showCurrentWord();
  }

  // ── Celebration confetti ──
  function celebrate() {
    const container = document.createElement("div");
    container.className = "celebration";
    document.body.appendChild(container);

    const emojis = ["🎉", "🌟", "✨", "🎊", "💫", "🥳", "👏", "🏆"];
    for (let i = 0; i < 20; i++) {
      const confetti = document.createElement("span");
      confetti.className = "confetti";
      confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      confetti.style.left = Math.random() * 100 + "%";
      confetti.style.animationDelay = Math.random() * 0.6 + "s";
      container.appendChild(confetti);
    }

    setTimeout(() => container.remove(), 2500);
  }

  // ── Event listeners ──
  document.getElementById("btn-play-letter").addEventListener("click", () => {
    unlockIOSAudio();
    speak(LETTER_DATA[currentLetter].sound, 0.75);
  });

  document.getElementById("btn-next-to-word").addEventListener("click", () => {
    showCurrentWord();
  });

  document.getElementById("btn-play-word").addEventListener("click", () => {
    unlockIOSAudio();
    const wordObj = LETTER_DATA[currentLetter].words[currentWordIndex];
    speak(wordObj.word, 0.75);
  });

  $btnRecord.addEventListener("click", () => {
    if (!isRecording) {
      startRecording();
    }
  });

  document.getElementById("btn-retry-word").addEventListener("click", () => {
    $scoreDisplay.style.display = "none";
    $btnRecord.style.display = "flex";
    speak(LETTER_DATA[currentLetter].words[currentWordIndex].word, 0.75);
  });

  document.getElementById("btn-next-word").addEventListener("click", () => {
    nextWord();
  });

  document.getElementById("btn-back").addEventListener("click", () => {
    if (recognition) {
      try { recognition.abort(); } catch (e) { /* safe */ }
    }
    const data = LETTER_DATA[currentLetter];
    if (data._originalWords) {
      data.words = data._originalWords;
      delete data._originalWords;
    }
    buildLetterGrid();
    showScreen($home);
  });

  // Pre-load voices
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  // Prevent double-tap zoom on iOS
  document.addEventListener("touchend", (e) => {
    if (e.target.closest("button")) {
      e.preventDefault();
      e.target.closest("button").click();
    }
  }, { passive: false });
})();
