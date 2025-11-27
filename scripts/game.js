// scripts/game.js
// 共用字庫與主題
let WORD_BANK = {};
let activeTopics = [];
let ACTIVE_WORDS = [];

// 第 1 階段
let stage1CurrentWord = null;
let stage1Answer = "";
let stage1CurrentSpelling = "";

// 第 2 階段
let stage2Cards = [];
let stage2FirstCard = null;

// 第 3 階段
let stage3Floor = 0;
let stage3CurrentWord = null;
let stage3CurrentType = null; // "zh-en" / "img-en" / "listen-en"
let stage3Answered = false;

// 第 4 階段
let stage4CurrentWord = null;
let stage4Answer = "";
let stage4GoodTrains = 0;

// 初始化：讀取字庫
async function loadWordBank() {
  try {
    const res = await fetch("word-bank.json");
    WORD_BANK = await res.json();
    console.log("game 字庫載入完成：", WORD_BANK);

    // 讀取首頁選擇的主題
    const saved = localStorage.getItem("selectedTopics");
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        activeTopics = arr.filter((t) => WORD_BANK[t]);
      } catch (e) {
        console.warn("解析 selectedTopics 失敗", e);
        activeTopics = [];
      }
    }

    if (!activeTopics || activeTopics.length === 0) {
      activeTopics = Object.keys(WORD_BANK);
    }

    ACTIVE_WORDS = buildActiveWordList();
    renderGameInfo();

    initStageTabs();
    initStage1();
    initStage2();
    initStage3();
    initStage4();
  } catch (err) {
    console.error("無法讀取 word-bank.json：", err);
    const stage = document.getElementById("stage1");
    if (stage) {
      stage.innerHTML = "<p>載入字庫失敗。</p>";
    }
  }
}

// 合併所有主題的單字
function buildActiveWordList() {
  let all = [];
  activeTopics.forEach((topic) => {
    const list = WORD_BANK[topic] || [];
    all = all.concat(list);
  });
  return all;
}

// 顯示主題與單字數資訊（左側欄）
function renderGameInfo() {
  const topicText = activeTopics.join("、") || "（無主題）";
  const wordCount = ACTIVE_WORDS.length;
  document.getElementById("game-topics").textContent = topicText;
  document.getElementById("game-word-count").textContent = wordCount;
}

// -------- 共用工具 --------

// 打亂陣列
function shuffleArray(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// 朗讀文字
function speak(text, lang = "en-US") {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  window.speechSynthesis.speak(utter);
}

// 簡單取 emoji 或 img 的 HTML
function getWordVisual(word) {
  if (word.img && word.img.trim()) {
    return `<img src="${word.img}" alt="" />`;
  }
  if (word.emoji && word.emoji.trim()) {
    const firstEmoji = word.emoji.toString().split(/\s+/)[0];
    return `<span>${firstEmoji}</span>`;
  }
  return `<span>📘</span>`;
}

// 顯示煙火：message 文字，duration 毫秒
function showFireworks(message = "恭喜完成！", duration = 2500) {
  const overlay = document.getElementById("fireworks-overlay");
  const textEl = document.getElementById("fireworks-text");
  if (!overlay || !textEl) return;
  textEl.textContent = message;
  overlay.classList.remove("hidden");
  setTimeout(() => {
    overlay.classList.add("hidden");
  }, duration);
}

// -------- 階段切換 --------

function initStageTabs() {
  const buttons = document.querySelectorAll(".stage-tab-button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      document
        .querySelectorAll(".stage-tab-button")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".stage-panel")
        .forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const panel = document.getElementById(target);
      if (panel) panel.classList.add("active");
    });
  });
}

// -------- 第 1 階段：認識單字 + 拼字 --------

function initStage1() {
  const listContainer = document.getElementById("stage1-wordList");
  if (!listContainer) return;

  listContainer.innerHTML = "";
  // 每一個 ACTIVE_WORDS 都是一張卡片
  ACTIVE_WORDS.forEach((w, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "word-card";
    card.innerHTML = `
      <div class="word-card-img">${getWordVisual(w)}</div>
      <div class="word-card-en">${w.en}</div>
    `;
    card.addEventListener("click", () => {
      speak(w.en, "en-US");
      selectStage1Word(w, index);
    });
    listContainer.appendChild(card);
  });

  // 音檔＆拼字按鈕
  const btnEn = document.getElementById("stage1-speak-en");
  const btnZh = document.getElementById("stage1-speak-zh");
  const btnSpell = document.getElementById("stage1-start-spell");

  if (btnEn) {
    btnEn.addEventListener("click", () => {
      if (stage1CurrentWord) speak(stage1CurrentWord.en, "en-US");
    });
  }
  if (btnZh) {
    btnZh.addEventListener("click", () => {
      if (stage1CurrentWord) speak(stage1CurrentWord.zh, "zh-TW");
    });
  }
  if (btnSpell) {
    btnSpell.addEventListener("click", () => {
      if (stage1CurrentWord) startStage1Spelling();
    });
  }
}

function selectStage1Word(word, index) {
  stage1CurrentWord = word;
  const cardEl = document.getElementById("stage1-card");
  const titleEl = document.getElementById("stage1-currentTitle");
  const imgEl = document.getElementById("stage1-img");
  const enEl = document.getElementById("stage1-en");
  const zhEl = document.getElementById("stage1-zh");
  const feedbackEl = document.getElementById("stage1-spell-feedback");
  const displayEl = document.getElementById("stage1-spell-display");
  const lettersEl = document.getElementById("stage1-letters");

  if (!cardEl) return;
  cardEl.classList.remove("hidden");

  titleEl.textContent = `現在練習第 ${index + 1} 個單字`;
  imgEl.innerHTML = getWordVisual(word);
  enEl.textContent = word.en;
  zhEl.textContent = word.zh || "";

  feedbackEl.textContent = "";
  displayEl.textContent = "";
  lettersEl.innerHTML = "";

  // 預先計算答案（只取英文小寫字母）
  stage1Answer = (word.en || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  stage1CurrentSpelling = "";
}

function startStage1Spelling() {
  if (!stage1CurrentWord || !stage1Answer) return;
  stage1CurrentSpelling = "";

  const lettersEl = document.getElementById("stage1-letters");
  const displayEl = document.getElementById("stage1-spell-display");
  const feedbackEl = document.getElementById("stage1-spell-feedback");
  lettersEl.innerHTML = "";
  displayEl.textContent = "";
  feedbackEl.textContent = "";

  const letters = stage1Answer.split("");
  const shuffled = shuffleArray(letters);

  shuffled.forEach((ch, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "letter-tile";
    btn.textContent = ch.toUpperCase();
    btn.dataset.char = ch;
    btn.addEventListener("click", () => {
      // 若已經完成就不再加
      if (stage1CurrentSpelling.length >= stage1Answer.length) return;
      stage1CurrentSpelling += ch;
      displayEl.textContent = stage1CurrentSpelling.toUpperCase();
      btn.disabled = true;
      btn.classList.add("used");

      if (stage1CurrentSpelling.length === stage1Answer.length) {
        checkStage1Spelling();
      }
    });
    lettersEl.appendChild(btn);
  });
}

function checkStage1Spelling() {
  const feedbackEl = document.getElementById("stage1-spell-feedback");
  if (!feedbackEl) return;
  if (stage1CurrentSpelling === stage1Answer) {
    feedbackEl.textContent = "Great Job！拼字正確！";
    feedbackEl.classList.remove("error");
    feedbackEl.classList.add("ok");
    speak("Great job!", "en-US");
  } else {
    feedbackEl.textContent = "再試一次喔～";
    feedbackEl.classList.remove("ok");
    feedbackEl.classList.add("error");
    speak("Try again!", "en-US");
  }
}

// -------- 第 2 階段：配對遊戲 --------

function initStage2() {
  const restartBtn = document.getElementById("stage2-restart");
  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      startStage2Game();
    });
  }
  startStage2Game();
}

function startStage2Game() {
  const grid = document.getElementById("stage2-grid");
  const statusEl = document.getElementById("stage2-status");
  if (!grid || !statusEl) return;

  grid.innerHTML = "";
  statusEl.textContent =
    "請試著找到 6 組正確的中英文配對（點卡片會唸出文字）。";

  // 隨機挑 6 個單字
  const words = shuffleArray(ACTIVE_WORDS).slice(0, 6);
  stage2Cards = [];
  stage2FirstCard = null;

  words.forEach((w, idx) => {
    stage2Cards.push({
      id: `w${idx}-en`,
      type: "en",
      word: w,
      matched: false,
    });
    stage2Cards.push({
      id: `w${idx}-zh`,
      type: "zh",
      word: w,
      matched: false,
    });
  });

  stage2Cards = shuffleArray(stage2Cards);

  stage2Cards.forEach((c) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className =
      "match-card " + (c.type === "zh" ? "match-card-zh" : "match-card-en");
    card.dataset.cardId = c.id;

    const label =
      c.type === "zh"
        ? `<span class="match-tag">中</span>${c.word.zh}`
        : `<span class="match-tag">EN</span>${c.word.en}`;

    card.innerHTML = `<div class="match-card-inner">${label}</div>`;

    card.addEventListener("click", () => handleStage2CardClick(c, card));

    grid.appendChild(card);
  });
}

function handleStage2CardClick(cardData, cardEl) {
  if (cardData.matched) return;

  speak(
    cardData.type === "en" ? cardData.word.en : cardData.word.zh,
    cardData.type === "en" ? "en-US" : "zh-TW"
  );

  if (!stage2FirstCard) {
    stage2FirstCard = { cardData, cardEl };
    cardEl.classList.add("selected");
    return;
  }

  // 第二張
  if (cardEl === stage2FirstCard.cardEl) return;

  cardEl.classList.add("selected");

  const first = stage2FirstCard.cardData;
  const second = cardData;

  const sameWord = first.word.id === second.word.id;
  const diffType = first.type !== second.type;

  if (sameWord && diffType) {
    // 配對成功
    first.matched = true;
    second.matched = true;
    stage2FirstCard.cardEl.classList.add("matched");
    cardEl.classList.add("matched");
    stage2FirstCard = null;

    speak("Great job!", "en-US");

    // 檢查是否全部完成
    const allMatched = stage2Cards.every((c) => c.matched);
    if (allMatched) {
      document.getElementById("stage2-status").textContent =
        "太棒了！你完成了這一局的所有配對！";
      showFireworks("配對完成！🎆 再玩一局吧！", 3000);
    }
  } else {
    // 錯誤配對
    const prevEl = stage2FirstCard.cardEl;
    stage2FirstCard = null;
    setTimeout(() => {
      prevEl.classList.remove("selected");
      cardEl.classList.remove("selected");
    }, 600);
  }
}

// -------- 第 3 階段：101 大樓 --------

function initStage3() {
  const nextBtn = document.getElementById("stage3-nextBtn");
  const resetBtn = document.getElementById("stage3-resetBtn");
  const repeatBtn = document.getElementById("stage3-repeatAudio");

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      startStage3Question();
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetStage3();
    });
  }
  if (repeatBtn) {
    repeatBtn.addEventListener("click", () => {
      if (
        stage3CurrentType === "listen-en" &&
        stage3CurrentWord &&
        stage3CurrentWord.en
      ) {
        speak(stage3CurrentWord.en, "en-US");
      }
    });
  }

  resetStage3();
}

function resetStage3() {
  stage3Floor = 0;
  stage3CurrentWord = null;
  stage3Answered = false;
  updateStage3Building();
  document.getElementById("stage3-feedback").textContent = "";
  document.getElementById("building-great").textContent = "";
  startStage3Question();
}

function startStage3Question() {
  if (stage3Floor >= 101) {
    // 已經完成
    showStage3Finished();
    return;
  }
  stage3Answered = false;
  const questionTypeIndex = Math.floor(Math.random() * 3);
  if (questionTypeIndex === 0) stage3CurrentType = "zh-en";
  else if (questionTypeIndex === 1) stage3CurrentType = "img-en";
  else stage3CurrentType = "listen-en";

  const word = ACTIVE_WORDS[Math.floor(Math.random() * ACTIVE_WORDS.length)];
  stage3CurrentWord = word;

  const typeLabel = document.getElementById("stage3-questionType");
  const promptEl = document.getElementById("stage3-questionPrompt");
  const repeatBtn = document.getElementById("stage3-repeatAudio");

  const optionsEl = document.getElementById("stage3-options");
  optionsEl.innerHTML = "";

  // 準備四個選項
  const candidates = shuffleArray(ACTIVE_WORDS)
    .filter((w) => w.id !== word.id)
    .slice(0, 3);
  candidates.push(word);
  const options = shuffleArray(candidates);

  if (stage3CurrentType === "zh-en") {
    typeLabel.textContent = "題型：看中文選英文";
    promptEl.innerHTML = `<span class="question-zh">${word.zh}</span>`;
    repeatBtn.style.visibility = "hidden";
  } else if (stage3CurrentType === "img-en") {
    typeLabel.textContent = "題型：看圖示選英文";
    promptEl.innerHTML = `<div class="question-img">${getWordVisual(
      word
    )}</div>`;
    repeatBtn.style.visibility = "hidden";
  } else {
    typeLabel.textContent = "題型：聽英文選英文";
    promptEl.innerHTML =
      '<span class="question-listen">請仔細聽題目，選出正確的英文單字。</span>';
    repeatBtn.style.visibility = "visible";
    speak(word.en, "en-US");
  }

  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "stage3-option-card";
    btn.textContent = opt.en;
    btn.addEventListener("click", () => handleStage3Answer(opt, btn));
    optionsEl.appendChild(btn);
  });

  document.getElementById("stage3-feedback").textContent = "";
  document.getElementById("building-great").textContent = "";
}

function handleStage3Answer(chosenWord, btn) {
  if (stage3Answered) return; // 每題只算一次
  stage3Answered = true;

  const isCorrect = chosenWord.id === stage3CurrentWord.id;
  const feedback = document.getElementById("stage3-feedback");
  const floorChangeEl = document.getElementById("building-change");
  const greatEl = document.getElementById("building-great");

  if (isCorrect) {
    stage3Floor += 10;
    if (stage3Floor > 101) stage3Floor = 101;
    feedback.textContent = "Great Job！大樓增加 10 層！";
    feedback.classList.remove("error");
    feedback.classList.add("ok");
    floorChangeEl.textContent = "+10 層";
    floorChangeEl.classList.add("show");
    greatEl.textContent = "Great Job!";
    speak("Great job!", "en-US");

    setTimeout(() => {
      floorChangeEl.classList.remove("show");
    }, 1000);
  } else {
    stage3Floor -= 5;
    if (stage3Floor < 0) stage3Floor = 0;
    feedback.textContent = "Try again! 再試一次！大樓減少 5 層。";
    feedback.classList.remove("ok");
    feedback.classList.add("error");
    floorChangeEl.textContent = "-5 層";
    floorChangeEl.classList.add("show");
    greatEl.textContent = "";
    speak("Try again! 再試一次！", "en-US");
    setTimeout(() => {
      floorChangeEl.classList.remove("show");
    }, 1000);
  }

  updateStage3Building();

  if (stage3Floor >= 101) {
    showStage3Finished();
  }
}

function updateStage3Building() {
  const floorEl = document.getElementById("stage3-floor");
  const towerEl = document.getElementById("building-tower");
  if (!floorEl || !towerEl) return;

  floorEl.textContent = stage3Floor;
  towerEl.innerHTML = "";

  const blocks = Math.floor(stage3Floor / 5); // 每 5 層一塊
  for (let i = 0; i < blocks; i++) {
    const div = document.createElement("div");
    div.className = "building-block";
    towerEl.appendChild(div);
  }
}

function showStage3Finished() {
  const feedback = document.getElementById("stage3-feedback");
  feedback.textContent = "101 大樓蓋好囉！恭喜完成！";
  feedback.classList.remove("error");
  feedback.classList.add("ok");
  showFireworks("101 大樓蓋好了！🎆 恭喜完成！", 3500);

  // 左側不再出題
  const optionsEl = document.getElementById("stage3-options");
  const promptEl = document.getElementById("stage3-questionPrompt");
  const typeEl = document.getElementById("stage3-questionType");
  const repeatBtn = document.getElementById("stage3-repeatAudio");
  if (optionsEl) optionsEl.innerHTML = "";
  if (promptEl) promptEl.innerHTML = "<span>恭喜完成本關！</span>";
  if (typeEl) typeEl.textContent = "題型：—";
  if (repeatBtn) repeatBtn.style.visibility = "hidden";
}

// -------- 第 4 階段：火車載貨拼單字 --------

function initStage4() {
  const goBtn = document.getElementById("stage4-goBtn");
  const resetBtn = document.getElementById("stage4-resetBtn");

  if (goBtn) {
    goBtn.addEventListener("click", () => {
      checkStage4Answer();
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetStage4();
    });
  }

  resetStage4();
}

function resetStage4() {
  stage4GoodTrains = 0;
  updateStage4Progress();
  startStage4Question();
}

function startStage4Question() {
  if (stage4GoodTrains >= 10) {
    showStage4Finished();
    return;
  }

  const word =
    ACTIVE_WORDS[Math.floor(Math.random() * ACTIVE_WORDS.length)];
  stage4CurrentWord = word;
  stage4Answer = (word.en || "").toLowerCase().replace(/[^a-z]/g, "");

  const zhEl = document.getElementById("stage4-zh");
  const imgEl = document.getElementById("stage4-img");
  const poolEl = document.getElementById("stage4-letterPool");
  const slotsEl = document.getElementById("stage4-letterSlots");

  if (zhEl) zhEl.textContent = word.zh || "";
  if (imgEl) imgEl.innerHTML = getWordVisual(word);

  poolEl.innerHTML = "";
  slotsEl.innerHTML = "";

  const letters = shuffleArray(stage4Answer.split(""));
  letters.forEach((ch, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "letter-tile big-letter";
    btn.textContent = ch.toUpperCase();
    btn.dataset.char = ch;
    btn.addEventListener("click", () => {
      moveLetterToSlot(btn);
    });
    poolEl.appendChild(btn);
  });

  for (let i = 0; i < stage4Answer.length; i++) {
    const slot = document.createElement("div");
    slot.className = "letter-slot";
    slot.dataset.index = i.toString();
    slot.addEventListener("click", () => {
      // 點 slot 把字母放回池子
      const currentChar = slot.dataset.char;
      if (currentChar) {
        const newBtn = document.createElement("button");
        newBtn.type = "button";
        newBtn.className = "letter-tile big-letter";
        newBtn.textContent = currentChar.toUpperCase();
        newBtn.dataset.char = currentChar;
        newBtn.addEventListener("click", () => {
          moveLetterToSlot(newBtn);
        });
        poolEl.appendChild(newBtn);
        slot.textContent = "";
        delete slot.dataset.char;
      }
    });
    slotsEl.appendChild(slot);
  }

  // 題目一開始唸出英文
  if (word.en) speak(word.en, "en-US");

  const train = document.getElementById("train");
  if (train) {
    train.classList.remove("train-move");
    train.classList.remove("train-leak");
  }
}

function moveLetterToSlot(btn) {
  const slotsEl = document.getElementById("stage4-letterSlots");
  const poolEl = document.getElementById("stage4-letterPool");
  if (!slotsEl || !poolEl) return;

  const slots = Array.from(slotsEl.querySelectorAll(".letter-slot"));
  const emptySlot = slots.find((s) => !s.dataset.char);

  if (!emptySlot) return;

  const ch = btn.dataset.char;
  emptySlot.dataset.char = ch;
  emptySlot.textContent = ch.toUpperCase();

  btn.remove();
}

function checkStage4Answer() {
  if (!stage4CurrentWord) return;
  const slotsEl = document.getElementById("stage4-letterSlots");
  const train = document.getElementById("train");
  const poolEl = document.getElementById("stage4-letterPool");

  const slots = Array.from(slotsEl.querySelectorAll(".letter-slot"));
  const spelled = slots
    .map((s) => s.dataset.char || "")
    .join("");

  if (spelled.length < stage4Answer.length) {
    alert("字母還沒拼完喔！");
    return;
  }

  const isCorrect = spelled === stage4Answer;

  if (isCorrect) {
    stage4GoodTrains++;
    updateStage4Progress();
    speak(stage4CurrentWord.en, "en-US");
    if (train) {
      train.classList.remove("train-leak");
      train.classList.add("train-move");
    }

    setTimeout(() => {
      if (stage4GoodTrains >= 10) {
        showStage4Finished();
      } else {
        startStage4Question();
      }
    }, 1800);
  } else {
    speak("Oops! Try again!", "en-US");
    if (train) {
      train.classList.remove("train-move");
      train.classList.add("train-leak");
    }

    setTimeout(() => {
      if (train) train.classList.remove("train-leak");
      startStage4Question();
    }, 1800);
  }
}

function updateStage4Progress() {
  const nEl = document.getElementById("stage4-goodTrains");
  if (nEl) nEl.textContent = String(stage4GoodTrains);
}

function showStage4Finished() {
  showFireworks("恭喜完成 10 台火車載貨！🎆", 3500);
  const qArea = document.getElementById("stage4-questionArea");
  const poolEl = document.getElementById("stage4-letterPool");
  const slotsEl = document.getElementById("stage4-letterSlots");
  const zhEl = document.getElementById("stage4-zh");
  if (qArea) {
    qArea.innerHTML = "<h3>恭喜完成本關！</h3>";
  }
  if (poolEl) poolEl.innerHTML = "";
  if (slotsEl) slotsEl.innerHTML = "";
  if (zhEl) zhEl.textContent = "";
}

// -----------------------

window.addEventListener("DOMContentLoaded", loadWordBank);
